import React, { useEffect, useState } from 'react';
import { dataService } from '../utils/dataService';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  FiDollarSign, 
  FiSearch, 
  FiCreditCard, 
  FiRotateCcw, 
  FiX, 
  FiCheckCircle, 
  FiAlertCircle,
  FiFilter
} from 'react-icons/fi';

const Payments = () => {
  const { role } = useAuth();
  const isReadOnly = role === 'Staff';

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Refund Modal State
  const [refundingPayment, setRefundingPayment] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Metrics
  const [metrics, setMetrics] = useState({
    gross: 0,
    refunded: 0,
    net: 0,
    pending: 0
  });

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { data } = await dataService.getPayments();
      if (data) {
        setPayments(data);
        setFilteredPayments(data);
        calculateMetrics(data);
      }
    } catch (e) {
      toast.error('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (dataList) => {
    let gross = 0;
    let refunded = 0;
    let pending = 0;

    dataList.forEach(p => {
      const amount = parseFloat(p.amount) || 0;
      const refAmt = parseFloat(p.refunded_amount) || 0;

      if (p.payment_status === 'Paid') {
        gross += amount;
      } else if (p.payment_status === 'Refunded') {
        gross += amount; // Included in gross, subtracted in net
        refunded += refAmt;
      } else if (p.payment_status === 'Pending') {
        pending += amount;
      }
    });

    setMetrics({
      gross,
      refunded,
      net: gross - refunded,
      pending
    });
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Filter & Search logic
  useEffect(() => {
    let result = payments;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.transaction_id && p.transaction_id.toLowerCase().includes(query)) ||
        (p.registration?.attendee?.full_name && p.registration.attendee.full_name.toLowerCase().includes(query)) ||
        (p.registration?.event?.name && p.registration.event.name.toLowerCase().includes(query))
      );
    }

    if (selectedStatus) {
      result = result.filter(p => p.payment_status === selectedStatus);
    }

    if (selectedMethod) {
      result = result.filter(p => p.payment_method === selectedMethod);
    }

    setFilteredPayments(result);
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedMethod, payments]);

  // Pagination helper
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const handleOpenRefund = (payment) => {
    setRefundingPayment(payment);
    reset({
      refund_amount: payment.amount
    });
  };

  const handleProcessRefund = async (data) => {
    try {
      const { error } = await dataService.refundPayment(refundingPayment.id, data.refund_amount);
      if (error) throw error;
      toast.success('Refund processed successfully');
      setRefundingPayment(null);
      loadPayments();
    } catch (e) {
      toast.error('Refund processing failed');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      Paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-250/20',
      Pending: 'bg-yellow-50 text-yellow-750 dark:bg-yellow-950/20 dark:text-yellow-400 border border-yellow-250/20',
      Failed: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-250/20',
      Refunded: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-250/20'
    };
    return (
      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${styles[status] || styles.Pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white m-0 font-display">
          Billing Ledger
        </h1>
        <p className="text-gray-550 dark:text-gray-400 text-sm mt-1">
          Monitor ticket revenues, process refunds, and track payment transactions.
        </p>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 hover:shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-xl">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs text-gray-400 font-semibold tracking-wide">Gross Revenue</span>
            <span className="text-xl font-bold text-gray-950 dark:text-white leading-none mt-1">{formatCurrency(metrics.gross)}</span>
          </div>
        </div>

        {/* Refunded */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 hover:shadow-sm">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-xl">
            <FiRotateCcw className="w-6 h-6" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs text-gray-400 font-semibold tracking-wide">Total Refunded</span>
            <span className="text-xl font-bold text-red-500 leading-none mt-1">{formatCurrency(metrics.refunded)}</span>
          </div>
        </div>

        {/* Net */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 hover:shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-xl">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs text-gray-400 font-semibold tracking-wide">Net Profit</span>
            <span className="text-xl font-bold text-emerald-500 leading-none mt-1">{formatCurrency(metrics.net)}</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 rounded-2xl flex items-center gap-4 hover:shadow-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-550 rounded-xl">
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs text-gray-400 font-semibold tracking-wide">Pending Volume</span>
            <span className="text-xl font-bold text-amber-550 dark:text-amber-400 leading-none mt-1">{formatCurrency(metrics.pending)}</span>
          </div>
        </div>

      </div>

      {/* Toolbar Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-4 rounded-2xl flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <FiSearch className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by transaction ID, attendee or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-brand-500 text-sm transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="block w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-850 rounded-xl text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        {/* Method filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="block w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-850 rounded-xl text-sm"
          >
            <option value="">All Methods</option>
            <option value="Stripe">Stripe</option>
            <option value="PayPal">PayPal</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl p-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mb-4">
            <FiCreditCard className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No transactions recorded</h3>
          <p className="mt-1 text-sm text-gray-505 dark:text-gray-400">
            No payments matched the search filters.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 bg-gray-550/5 dark:bg-gray-850 dark:text-gray-300 uppercase border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Transaction ID</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Date</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Attendee</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Event</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Method</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Gross</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center">Refund Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {currentItems.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-550/5">
                    <td className="px-6 py-4 font-mono text-xs text-gray-950 dark:text-white">{payment.transaction_id || 'ch_pending'}</td>
                    <td className="px-6 py-4 text-xs">{formatDate(payment.created_at)}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      <div className="flex flex-col text-left">
                        <span>{payment.registration?.attendee?.full_name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-555 font-mono mt-0.5">{payment.registration?.attendee?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left font-medium max-w-xs truncate">{payment.registration?.event?.name}</td>
                    <td className="px-6 py-4 text-xs font-semibold">{payment.payment_method}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {payment.payment_status === 'Refunded' ? (
                        <div className="flex flex-col items-start leading-none">
                          <span className="line-through text-gray-400 text-xs">{formatCurrency(payment.amount)}</span>
                          <span className="text-red-500 font-semibold text-[10px] mt-1">Ref: {formatCurrency(payment.refunded_amount)}</span>
                        </div>
                      ) : (
                        formatCurrency(payment.amount)
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(payment.payment_status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        {!isReadOnly && payment.payment_status === 'Paid' && payment.amount > 0 ? (
                          <button
                            onClick={() => handleOpenRefund(payment)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-900/20 dark:text-red-400 rounded-xl text-xs font-bold transition-all"
                            title="Initiate Refund"
                          >
                            <FiRotateCcw className="w-3.5 h-3.5" />
                            <span>Refund</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium font-mono">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-550/5 dark:bg-gray-850/10 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length} transactions
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-850 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-850 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-805 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REFUND AMOUNT MODAL */}
      {refundingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white font-display">Process Refund</h3>
              <button onClick={() => setRefundingPayment(null)} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-850 p-1 rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleProcessRefund)} className="space-y-4">
              <div className="text-left bg-gray-50 dark:bg-gray-950 p-3.5 border border-gray-100 dark:border-gray-850 rounded-xl space-y-1.5">
                <p className="text-[11px] font-semibold text-gray-400 uppercase leading-none">Original Amount</p>
                <p className="text-lg font-extrabold text-gray-900 dark:text-white leading-none mt-1">{formatCurrency(refundingPayment.amount)}</p>
                <p className="text-[10px] text-gray-500 font-mono mt-1 block">TxID: {refundingPayment.transaction_id}</p>
              </div>

              <div className="text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Refund Value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('refund_amount', { 
                    required: 'Amount is required', 
                    min: { value: 0.01, message: 'Must be greater than $0' },
                    max: { value: refundingPayment.amount, message: 'Cannot exceed original amount' }
                  })}
                  className="mt-1.5 block w-full px-3 py-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-250 dark:border-gray-800 rounded-xl text-sm"
                  placeholder="0.00"
                />
                {errors.refund_amount && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.refund_amount.message}</span>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setRefundingPayment(null)}
                  className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-205 dark:border-gray-800 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                >
                  Execute Refund
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
