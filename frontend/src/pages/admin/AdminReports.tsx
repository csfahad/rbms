import { useState } from 'react';
import { Calendar, Download, BarChart2, Pi as Pie, TrendingUp, DollarSign, Clock, Users } from 'lucide-react';

// Sample report types
const reportTypes = [
  {
    id: 'daily-booking',
    name: 'Daily Booking Report',
    description: 'Overview of all bookings made in a single day',
    icon: Calendar
  },
  {
    id: 'revenue',
    name: 'Revenue Report',
    description: 'Track income generated over a period based on completed bookings',
    icon: DollarSign
  },
  {
    id: 'load-factor',
    name: 'Train Load Factor Report',
    description: 'Evaluate seat occupancy percentage across various train services',
    icon: Users
  },
  {
    id: 'user-activity',
    name: 'User Activity Report',
    description: 'Track user engagement and activity trends',
    icon: TrendingUp
  },
  {
    id: 'cancellation',
    name: 'Cancellation Analysis Report',
    description: 'Understand cancellation patterns and potential service issues',
    icon: Clock
  },
  {
    id: 'train-performance',
    name: 'Train Performance Report',
    description: 'Evaluate each train route\'s operational performance',
    icon: BarChart2
  }
];

const AdminReports = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const handleGenerateReport = () => {
    if (!selectedReport || !startDate || !endDate) {
      alert('Please select a report type and date range');
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 1500);
  };
  
  const handleDownload = (format: 'pdf' | 'csv' | 'excel') => {
    // In a real app, this would generate and download the report in the selected format
    alert(`Downloading report in ${format.toUpperCase()} format...`);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and download various reports</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Report Selection Panel */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h2>
              
              <div className="space-y-3">
                {reportTypes.map((report) => (
                  <div 
                    key={report.id}
                    className={`flex items-start p-3 rounded-md cursor-pointer transition-colors ${
                      selectedReport === report.id ? 'bg-primary-light/10 border border-primary' : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedReport(report.id)}
                  >
                    <div className={`p-2 rounded-full mr-3 ${selectedReport === report.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                      <report.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className={`font-medium ${selectedReport === report.id ? 'text-primary' : 'text-gray-900'}`}>
                        {report.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Report Parameters */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Parameters</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="startDate" className="form-label">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="form-label">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input"
                    min={startDate}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleGenerateReport}
                  disabled={!selectedReport || !startDate || !endDate || isGenerating}
                  className="btn btn-primary flex items-center"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                        <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart2 className="h-5 w-5 mr-2" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Report Preview */}
            {showPreview && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {reportTypes.find(r => r.id === selectedReport)?.name} Preview
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload('pdf')}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </button>
                    <button
                      onClick={() => handleDownload('csv')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      CSV
                    </button>
                    <button
                      onClick={() => handleDownload('excel')}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Excel
                    </button>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="text-center mb-4">
                    <h3 className="font-bold">
                      {reportTypes.find(r => r.id === selectedReport)?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Sample Report Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Bar Chart Visualization</p>
                      </div>
                    </div>
                    
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Pie className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Pie Chart Visualization</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {selectedReport === 'daily-booking' && (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Train</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </>
                          )}
                          
                          {selectedReport === 'revenue' && (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Ticket Price</th>
                            </>
                          )}
                          
                          {selectedReport === 'load-factor' && (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Train</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Seats</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booked Seats</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Load Factor</th>
                            </>
                          )}
                          
                          {/* Placeholder rows for other report types */}
                          {!['daily-booking', 'revenue', 'load-factor'].includes(selectedReport) && (
                            <>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Column 1</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Column 2</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Column 3</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Column 4</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan={7}>
                            Sample report data would appear here
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;