import { SkeletonTable } from "../../components/admin/SkeletonLoader";
import { motion } from 'framer-motion';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5073/api';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter } from 'react-icons/fi';
import MaintenanceSidebar from '../../components/maintenance/MaintenanceSidebar';
import CustomDropdown from '../../components/CustomDropdown';
import Pagination from '../../components/Pagination';
import useIsMobile from '../../hooks/useIsMobile';
import '../payment/PaymentDashboard.css';
import './Complaints.css';

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [techFilter, setTechFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();
  const [desktopPageSize, setDesktopPageSize] = useState(15);
  const pageSize = isMobile ? 10 : desktopPageSize;

  const [categories, setCategories] = useState([]);
  const [techs, setTechs] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('ah_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    Promise.all([
      fetch(`${API_BASE}/maintenance`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/maintenance/categories`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/maintenance/technicians`, { headers }).then(r => r.json())
    ])
    .then(([maintData, catData, techData]) => {
      setComplaints(maintData);
      setCategories(catData);
      setTechs(techData);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesPriority = priorityFilter ? c.priority === priorityFilter : true;
    const matchesCategory = categoryFilter ? c.category?.id.toString() === categoryFilter : true;
    const matchesTech = techFilter ? c.technician?.id.toString() === techFilter : true;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesTech;
  });

  const pageCount = Math.ceil(filteredComplaints.length / pageSize);
  const visiblePage = Math.min(currentPage, Math.max(1, pageCount));
  const visibleComplaints = filteredComplaints.slice((visiblePage - 1) * pageSize, visiblePage * pageSize);

  return (
    <div className="payment-page">
      <MaintenanceSidebar />
      <motion.main className="payment-content" initial={{opacity:0, y:15}} animate={{opacity:1, y:0}} transition={{duration:0.25, ease:"easeInOut"}}>
        <header className="payment-header">
          <div>
            <p className="page-label">MAINTENANCE</p>
            <h1>Complaints List</h1>
            <p className="page-description">
              View and manage all resident complaints.
            </p>
          </div>
          <button onClick={() => window.print()} style={{ alignSelf: 'center', height: 'fit-content', padding: '10px 24px', border: 'none', borderRadius: '50px', background: '#000', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'opacity 0.2s' }} onMouseOver={(e) => e.target.style.opacity = '0.8'} onMouseOut={(e) => e.target.style.opacity = '1'}>
            Download PDF
          </button>
        </header>
        
        <section className="dashboard-panel">
          <div className="panel-heading" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <h2>All Complaints</h2>
              <p>Current issues in the system.</p>
            </div>

            {/* Search & Filter Bar */}
            <div className="search-filter-row">
              <div className="search-pill">
                <FiSearch className="search-pill-icon" />
                <input
                  type="text"
                  placeholder="Search complaints by title..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="search-pill-input"
                />
                <FiFilter className="search-pill-right-icon" />
              </div>

              <CustomDropdown
                value={statusFilter}
                onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
                placeholder="All Statuses"
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Assigned', label: 'Assigned' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Resolved', label: 'Resolved' },
                  { value: 'Closed', label: 'Closed' },
                ]}
              />

              <CustomDropdown
                value={priorityFilter}
                onChange={(value) => { setPriorityFilter(value); setCurrentPage(1); }}
                placeholder="All Priorities"
                options={[
                  { value: '', label: 'All Priorities' },
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                  { value: 'Urgent', label: 'Urgent' },
                ]}
              />

              <CustomDropdown
                value={categoryFilter}
                onChange={(value) => { setCategoryFilter(value); setCurrentPage(1); }}
                placeholder="All Categories"
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map(c => ({ value: c.id.toString(), label: c.name }))
                ]}
              />

              <CustomDropdown
                value={techFilter}
                onChange={(value) => { setTechFilter(value); setCurrentPage(1); }}
                placeholder="All Technicians"
                options={[
                  { value: '', label: 'All Technicians' },
                  ...techs.map(t => ({ value: t.id.toString(), label: t.name }))
                ]}
              />
            </div>
          </div>

          {loading ? (
            <SkeletonTable rows={5} columns={8} />
          ) : filteredComplaints.length === 0 ? (
            <div className="empty-state">
              <h3>No complaints found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
            <div className="table-wrapper">
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Technician</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleComplaints.map(c => (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td>{c.title}</td>
                      <td>{c.category?.name || 'Unknown'}</td>
                      <td>
                        <span className={`status-badge ${c.priority.toLowerCase()}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${c.status.replace(' ', '-').toLowerCase()}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>{c.technician?.name || '-'}</td>
                      <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/maintenance/complaints/${c.id}`} style={{ color: '#0d6efd', textDecoration: 'none', fontWeight: 'bold' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={visiblePage}
              totalItems={filteredComplaints.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 15, 25]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setDesktopPageSize(size); setCurrentPage(1); }}
              label="complaints"
            />
            </>
          )}
        </section>
      </motion.main>
</div>
  );
}

export default Complaints;
