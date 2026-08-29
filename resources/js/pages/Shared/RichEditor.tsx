// resources/js/pages/Shared/RichEditor.tsx
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

declare global {
    interface Window { ckeditor5?: Record<string, any>; }
}

const C = { navy: '#011638', blue: '#0D21A1', gold: '#EEC643' };

const CDN_VER = '42.0.2';
const CDN_CSS = `https://cdn.ckeditor.com/ckeditor5/${CDN_VER}/ckeditor5.css`;
const CDN_JS  = `https://cdn.ckeditor.com/ckeditor5/${CDN_VER}/ckeditor5.umd.js`;

let _loadPromise: Promise<void> | null = null;
function loadCKEditor(): Promise<void> {
    if (_loadPromise) return _loadPromise;
    _loadPromise = new Promise<void>((resolve, reject) => {
        if (!document.querySelector(`link[href="${CDN_CSS}"]`)) {
            const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: CDN_CSS });
            document.head.appendChild(link);
        }
        if (window.ckeditor5?.ClassicEditor) { resolve(); return; }
        const script = Object.assign(document.createElement('script'), { src: CDN_JS, async: true });
        script.onload  = () => requestAnimationFrame(() =>
            window.ckeditor5?.ClassicEditor ? resolve() :
            reject(new Error(`CKEditor loaded but ClassicEditor not found. Keys: ${Object.keys(window.ckeditor5 ?? {}).slice(0,8).join(', ')}`))
        );
        script.onerror = () => reject(new Error('Failed to load CKEditor from CDN. Check network / CSP.'));
        document.head.appendChild(script);
    });
    return _loadPromise;
}

export interface RichEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    error?: string;
    minHeight?: number;
    readOnly?: boolean;
    uploadImage?: (file: File) => Promise<{ url: string }>;
}

export function RichEditor({
    value, onChange, placeholder = 'Write here…',
    error, minHeight = 260, readOnly = false, uploadImage,
}: RichEditorProps) {
    const editorRef   = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<any>(null);
    const [ready,     setReady]     = useState(false);
    const [initError, setInitError] = useState('');

    useEffect(() => {
        let destroyed = false;
        async function boot() {
            try { await loadCKEditor(); } catch (e: any) { if (!destroyed) setInitError(e?.message ?? String(e)); return; }
            if (destroyed || !editorRef.current) return;

            const ck = window.ckeditor5!;
            const plugins = [
                ck.Essentials, ck.Paragraph, ck.Heading,
                ck.FontSize, ck.FontColor, ck.FontBackgroundColor,
                ck.Bold, ck.Italic, ck.Underline, ck.Strikethrough,
                ck.Link, ck.AutoLink,
                ck.List, ck.BlockQuote,
                ck.Alignment,
                ck.Image, ck.ImageCaption, ck.ImageStyle,
                ck.ImageToolbar, ck.ImageResizeEditing, ck.ImageResizeHandles, ck.AutoImage,
                ck.Table, ck.TableToolbar, ck.TableCellProperties, ck.TableProperties,
                ck.Indent, ck.IndentBlock,
                ck.HorizontalLine, ck.SpecialCharacters,
                ck.RemoveFormat,
                ...(uploadImage ? [ck.ImageUpload, ck.FileRepository] : []),
            ].filter(Boolean);

            const extraPlugins: any[] = uploadImage ? [
                function UploadAdapter(editor: any) {
                    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => ({
                        upload: async () => { const f = await loader.file; const { url } = await uploadImage!(f); return { default: url }; },
                    });
                }
            ] : [];

            const config: any = {
                plugins, extraPlugins,
                initialData: value,
                placeholder,
                isReadOnly: readOnly,
                toolbar: {
                    items: [
                        'heading', '|',
                        'fontSize', 'fontColor', 'fontBackgroundColor', '|',
                        'bold', 'italic', 'underline', 'strikethrough', 'removeFormat', '|',
                        'alignment', '|',
                        'link', '|',
                        'bulletedList', 'numberedList', 'blockQuote', '|',
                        'outdent', 'indent', '|',
                        'insertTable', '|',
                        ...(uploadImage ? ['uploadImage', '|'] : []),
                        'horizontalLine', 'specialCharacters', '|',
                        'undo', 'redo',
                    ],
                    shouldNotGroupWhenFull: true,
                },
                heading: {
                    options: [
                        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
                    ],
                },
                fontSize: { options: [10, 12, 14, 'default', 18, 20, 24, 28, 32] },
                alignment: { options: ['left', 'center', 'right', 'justify'] },
                link: {
                    defaultProtocol: 'https://',
                    decorators: {
                        openInNewTab: { mode: 'manual', label: 'Open in a new tab', attributes: { target: '_blank', rel: 'noopener noreferrer' } },
                    },
                },
                image: {
                    toolbar: ['imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'toggleImageCaption', 'imageTextAlternative', '|', 'resizeImage'],
                },
                table: {
                    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
                },
            };

            try {
                const editor = await ck.ClassicEditor.create(editorRef.current!, config);
                if (destroyed) { editor.destroy(); return; }
                instanceRef.current = editor;
                if (readOnly) editor.enableReadOnlyMode('readonly');
                editor.model.document.on('change:data', () => onChange(editor.getData()));
                setReady(true);
            } catch (e: any) { if (!destroyed) setInitError(e?.message ?? String(e)); }
        }
        boot();
        return () => {
            destroyed = true;
            instanceRef.current?.destroy().catch(() => {});
            instanceRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync external value
    useEffect(() => {
        const ed = instanceRef.current;
        if (!ed || !ready) return;
        if (ed.getData() !== value) ed.setData(value);
    }, [value, ready]);

    if (initError) return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div>
                <p className="font-bold text-red-600 mb-1">Rich editor failed to load</p>
                <p className="text-xs text-red-500 whitespace-pre-wrap break-all">{initError}</p>
                <p className="text-xs text-gray-500 mt-2">Fallback: use a plain textarea instead.</p>
            </div>
        </div>
    );

    return (
        <div>
            <style>{`
                .ck-rich-wrap .ck.ck-editor__main>.ck-editor__editable {
                    min-height: ${minHeight}px;
                    border-bottom-left-radius: 12px !important;
                    border-bottom-right-radius: 12px !important;
                    border-color: ${error ? '#FCA5A5' : '#E5E7EB'} !important;
                    background: ${readOnly ? '#F9FAFB' : '#FFFFFF'} !important;
                    font-size: 14px; line-height: 1.75; padding: 16px 18px; color: #111827;
                }
                .ck-rich-wrap .ck.ck-editor__main>.ck-editor__editable:focus {
                    border-color: ${C.blue} !important;
                    box-shadow: 0 0 0 3px ${C.blue}22 !important;
                }
                .ck-rich-wrap .ck.ck-toolbar {
                    border-top-left-radius: 12px !important; border-top-right-radius: 12px !important;
                    border-color: ${error ? '#FCA5A5' : '#E5E7EB'} !important;
                    background: #fff !important; padding: 6px 8px !important; flex-wrap: wrap !important;
                }
                .ck-rich-wrap .ck.ck-toolbar .ck-button:hover,
                .ck-rich-wrap .ck.ck-toolbar .ck-button.ck-on { background: ${C.blue}18 !important; color: ${C.navy} !important; }
                .ck-rich-wrap .ck-editor__editable h1 { font-size:2em;   font-weight:800; margin:.5em 0 .25em; line-height:1.2; }
                .ck-rich-wrap .ck-editor__editable h2 { font-size:1.5em; font-weight:700; margin:.5em 0 .25em; line-height:1.3; }
                .ck-rich-wrap .ck-editor__editable h3 { font-size:1.25em;font-weight:700; margin:.4em 0 .2em; }
                .ck-rich-wrap .ck-editor__editable h4 { font-size:1.1em; font-weight:600; margin:.4em 0 .2em; }
                .ck-rich-wrap .ck-editor__editable a  { color:${C.blue}; text-decoration:underline; }
                .ck-rich-wrap .ck-editor__editable ul,
                .ck-rich-wrap .ck-editor__editable ol { padding-left:1.5em; margin:.4em 0; }
                .ck-rich-wrap .ck-editor__editable ul { list-style-type:disc; }
                .ck-rich-wrap .ck-editor__editable ol { list-style-type:decimal; }
                .ck-rich-wrap .ck-editor__editable blockquote {
                    border-left:4px solid ${C.gold}; padding-left:14px;
                    color:#6B7280; font-style:italic; margin:.5em 0;
                }
                .ck-rich-wrap .ck-editor__editable table { border-collapse:collapse; width:100%; margin:1em 0; }
                .ck-rich-wrap .ck-editor__editable table td,
                .ck-rich-wrap .ck-editor__editable table th {
                    border:1px solid #E5E7EB; padding:8px 12px; font-size:13px;
                }
                .ck-rich-wrap .ck-editor__editable table th { background:#F9FAFB; font-weight:700; }
                .ck-rich-wrap .ck-editor__editable figure.image { margin:1em auto; max-width:100%; }
                .ck-rich-wrap .ck-editor__editable figure.image img { border-radius:8px; max-width:100%; }
                .ck-rich-wrap .ck-powered-by { display:none !important; }
            `}</style>
            <div className={`ck-rich-wrap rounded-xl overflow-hidden shadow-sm transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div ref={editorRef} />
            </div>
            {!ready && !initError && (
                <p className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1.5 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading rich editor…
                </p>
            )}
            {error && (
                <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
                </p>
            )}
        </div>
    );
}