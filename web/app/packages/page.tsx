'use client';

import { useState, useEffect } from 'react';
import { packagesApi } from '../../lib/api';

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    hubId: '',
    page: 1,
    limit: 20,
  });
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [deliveryData, setDeliveryData] = useState({
    deliveryTime: new Date().toISOString().slice(0, 16),
    proofPhoto: null as File | null,
    signature: '',
    requireSignature: false,
    notes: '',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Check for hubId in URL params
    const params = new URLSearchParams(window.location.search);
    const hubId = params.get('hubId');
    if (hubId) {
      setFilters(prev => ({ ...prev, hubId }));
    } else {
      fetchPackages();
    }
  }, []);

  useEffect(() => {
    if (filters.hubId || filters.status) {
      fetchPackages();
    }
  }, [filters]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      // Remove empty string values from filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      const response = await packagesApi.getAll(cleanFilters);
      setPackages(response.data?.data || []);
    } catch (error: any) {
      console.error('Error fetching packages:', error);
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_TRANSIT: 'bg-blue-100 text-blue-800',
      AT_HUB: 'bg-purple-100 text-purple-800',
      OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      RETURNED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const openDeliveryModal = (pkg: any) => {
    setSelectedPackage(pkg);
    setDeliveryData({
      deliveryTime: new Date().toISOString().slice(0, 16),
      proofPhoto: null,
      signature: '',
      requireSignature: false,
      notes: '',
    });
    setShowDeliveryModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDeliveryData({ ...deliveryData, proofPhoto: e.target.files[0] });
    }
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;

    try {
      setUploading(true);

      // PRODUCTION TODO: Upload photo to cloud storage (AWS S3, Cloudinary, etc.)
      // Expected flow:
      // 1. Upload file to storage service
      // 2. Get back public URL
      // 3. Save URL to database
      // Example: const response = await uploadToS3(deliveryData.proofPhoto);
      //          proofPhotoUrl = response.url;
      let proofPhotoUrl = '';
      if (deliveryData.proofPhoto) {
        const reader = new FileReader();
        reader.readAsDataURL(deliveryData.proofPhoto);
        proofPhotoUrl = `https://example.com/proof/${selectedPackage.id}.jpg`; // Simulated URL
      }

      // Update package status
      await packagesApi.update(selectedPackage.id, {
        status: 'DELIVERED',
        deliveredAt: new Date(deliveryData.deliveryTime).toISOString(),
        proofOfDeliveryUrl: proofPhotoUrl,
        deliverySignature: deliveryData.signature,
        deliveryNotes: deliveryData.notes,
      });

      alert('Package marked as delivered successfully!');
      setShowDeliveryModal(false);
      fetchPackages(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating package:', error);
      alert('Failed to update package: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading packages...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Packages</h1>
          <div className="flex gap-2">
            <a
              href="/packages/map"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              📍 Map View
            </a>
            <a
              href="/dashboard"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Back to Dashboard
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          {filters.hubId && (
            <div className="mb-4 text-sm text-gray-600">
              Filtering by specific hub
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="AT_HUB">At Hub</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Packages List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              All Packages ({packages.length})
            </h2>
          </div>

          {packages.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No packages found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hub
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {pkg.trackingNumber}
                        </div>
                        {pkg.barcode && (
                          <div className="text-xs text-gray-500">
                            Barcode: {pkg.barcode}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(pkg.status)}`}>
                          {pkg.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{pkg.recipientName || 'N/A'}</div>
                        {pkg.recipientPhone && (
                          <div className="text-xs text-gray-500">{pkg.recipientPhone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {pkg.deliveryAddress || 'No address specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pkg.assignedHub?.name || pkg.hub?.name || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(pkg.status === 'OUT_FOR_DELIVERY' || pkg.status === 'AT_HUB') && (
                          <button
                            onClick={() => openDeliveryModal(pkg)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {pkg.status === 'DELIVERED' && (
                          <span className="text-gray-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delivery Update Modal */}
        {showDeliveryModal && selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Mark Package as Delivered</h2>
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  disabled={uploading}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleDeliverySubmit} className="p-6">
                {/* Package Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Package Details</h3>
                  <div className="text-sm text-gray-600">
                    <p><strong>Tracking:</strong> {selectedPackage.trackingNumber}</p>
                    <p><strong>Recipient:</strong> {selectedPackage.recipientName}</p>
                    <p><strong>Address:</strong> {selectedPackage.deliveryAddress}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Delivery Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={deliveryData.deliveryTime}
                      onChange={(e) => setDeliveryData({ ...deliveryData, deliveryTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {/* Proof of Delivery Photo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proof of Delivery Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a photo of the delivered package at the location
                    </p>
                    {deliveryData.proofPhoto && (
                      <div className="mt-2 text-sm text-green-600">
                        ✓ Photo selected: {deliveryData.proofPhoto.name}
                      </div>
                    )}
                  </div>

                  {/* Signature Option */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={deliveryData.requireSignature}
                        onChange={(e) => setDeliveryData({ ...deliveryData, requireSignature: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Require Signature</span>
                    </label>
                  </div>

                  {/* Signature Input (if enabled) */}
                  {deliveryData.requireSignature && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Recipient Signature (Name) *
                      </label>
                      <input
                        type="text"
                        value={deliveryData.signature}
                        onChange={(e) => setDeliveryData({ ...deliveryData, signature: e.target.value })}
                        placeholder="Enter recipient's name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required={deliveryData.requireSignature}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        In production, this would be a signature pad for drawing
                      </p>
                    </div>
                  )}

                  {/* Delivery Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Notes (Optional)
                    </label>
                    <textarea
                      value={deliveryData.notes}
                      onChange={(e) => setDeliveryData({ ...deliveryData, notes: e.target.value })}
                      placeholder="Add any notes about the delivery..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Once marked as delivered, the package status will be updated
                      and the customer will be notified. Make sure all information is accurate.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-medium disabled:bg-gray-400"
                    >
                      {uploading ? 'Updating...' : 'Confirm Delivery'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeliveryModal(false)}
                      disabled={uploading}
                      className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300 font-medium disabled:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
