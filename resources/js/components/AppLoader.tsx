import { ClipLoader } from "react-spinners";

export default function AppLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            <div className="text-center">
                <ClipLoader
                    color="#2563eb"
                    size={60}
                    speedMultiplier={1}
                />

                <p className="mt-4 text-gray-600 font-medium">
                    Loading...
                </p>
            </div>
        </div>
    );
}