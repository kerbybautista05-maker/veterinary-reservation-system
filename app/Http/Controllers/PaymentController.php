<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Appointment;
use App\Models\Notification;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private function canAccess(Request $request, Payment $payment): bool
    {
        $user = $request->user();
        return $user->isAdmin() || $payment->owner_id === $user->id;
    }

    // =========================================================================
    // index — Pet Owner sees own payments; Admin sees all (with revenue summary)
    // =========================================================================

    public function index(Request $request)
    {
        try {
            $user  = $request->user();
            $query = Payment::with(['appointment.pet', 'owner']);

            if ($user->isPetOwner()) {
                $query->where('owner_id', $user->id);
            }

            if ($status = $request->input('status')) {
                $query->status($status);
            }
            if ($from = $request->input('date_from')) {
                $query->whereDate('created_at', '>=', $from);
            }
            if ($to = $request->input('date_to')) {
                $query->whereDate('created_at', '<=', $to);
            }

            $payments = $query->orderByDesc('created_at')->paginate($request->input('per_page', 15));

            $response = [
                'success'    => true,
                'data'       => $payments->items(),
                'pagination' => [
                    'current_page' => $payments->currentPage(),
                    'last_page'    => $payments->lastPage(),
                    'per_page'     => $payments->perPage(),
                    'total'        => $payments->total(),
                ],
            ];

            if ($user->isAdmin()) {
                $response['total_revenue'] = Payment::getTotalRevenue($request->input('date_from'), $request->input('date_to'));
            }

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Error fetching payments: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to retrieve payments', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // store — Pet Owner initiates a payment for an appointment
    // =========================================================================

    public function store(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user->isPetOwner() && !$user->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $validator = Validator::make($request->all(), [
                'appointment_id'  => 'required|exists:appointments,id',
                'amount'          => 'required|numeric|min:0',
                'currency'        => 'nullable|string|max:10',
                'payment_method'  => 'required|in:cash,gcash,paymaya,credit_card,debit_card,bank_transfer',
                'transaction_reference' => 'required_unless:payment_method,cash|nullable|string|max:150',
                'receipt'         => 'required_unless:payment_method,cash|nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
                'notes'           => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $appointment = Appointment::findOrFail($request->input('appointment_id'));
            if (!$user->isAdmin() && $appointment->owner_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'You may only pay for your own appointments.'], 403);
            }

            $data = $validator->validated();
            if ($request->hasFile('receipt')) {
                $data['receipt_path'] = $request->file('receipt')->store('receipts', 'public');
            }
            unset($data['receipt']);

            $data['appointment_id'] = $appointment->id;
            $data['owner_id']       = $appointment->owner_id;
            $data['status']         = Payment::STATUS_PENDING;

            $payment = Payment::create($data);

            ActivityLog::record($user, 'created_payment', $payment, null, $payment->toArray());

            return response()->json([
                'success' => true,
                'data'    => $payment->load(['appointment', 'owner']),
                'message' => 'Payment recorded and pending confirmation.',
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Appointment not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error creating payment: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to record payment', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // show
    // =========================================================================

    public function show(Request $request, $id)
    {
        try {
            $payment = Payment::with(['appointment.pet', 'owner'])->findOrFail($id);

            if (!$this->canAccess($request, $payment)) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            return response()->json(['success' => true, 'data' => $payment]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }
    }

    // =========================================================================
    // markPaid — Admin confirms a payment was received
    // =========================================================================

    public function markPaid(Request $request, $id)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $validator = Validator::make($request->all(), [
                'transaction_reference' => 'nullable|string|max:150',
            ]);
            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $payment = Payment::findOrFail($id);
            $payment->markAsPaid($request->input('transaction_reference'));

            ActivityLog::record($request->user(), 'marked_payment_paid', $payment);

            Notification::notify(
                $payment->owner,
                'Payment Received',
                "We've received your payment of {$payment->currency} " . number_format((float) $payment->amount, 2) . '.',
                Notification::TYPE_PAYMENT_UPDATE
            );

            return response()->json([
                'success' => true,
                'data'    => $payment->fresh(),
                'message' => 'Payment marked as paid.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Payment not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error marking payment paid: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update payment', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // markFailed — Admin marks a payment attempt as failed
    // =========================================================================

    public function markFailed(Request $request, $id)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $payment = Payment::findOrFail($id);
            $payment->markAsFailed();

            ActivityLog::record($request->user(), 'marked_payment_failed', $payment);

            Notification::notify(
                $payment->owner,
                'Payment Failed',
                'Your payment could not be processed. Please try again or contact the clinic.',
                Notification::TYPE_PAYMENT_UPDATE
            );

            return response()->json([
                'success' => true,
                'data'    => $payment->fresh(),
                'message' => 'Payment marked as failed.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Payment not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error marking payment failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to update payment', 'error' => $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // refund — Admin refunds a paid transaction
    // =========================================================================

    public function refund(Request $request, $id)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
            }

            $payment = Payment::findOrFail($id);
            if (!$payment->isPaid()) {
                return response()->json(['success' => false, 'message' => 'Only paid transactions can be refunded.'], 422);
            }

            $payment->refund();
            ActivityLog::record($request->user(), 'refunded_payment', $payment);

            Notification::notify(
                $payment->owner,
                'Payment Refunded',
                "Your payment of {$payment->currency} " . number_format((float) $payment->amount, 2) . ' has been refunded.',
                Notification::TYPE_PAYMENT_UPDATE
            );

            return response()->json([
                'success' => true,
                'data'    => $payment->fresh(),
                'message' => 'Payment refunded.',
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Payment not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Error refunding payment: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to refund payment', 'error' => $e->getMessage()], 500);
        }
    }
}
