import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaintenanceSidebar from '../../components/maintenance/MaintenanceSidebar';
import '../payment/PaymentDashboard.css';
import '../payment/GenerateInvoice.css'; // Use the exact same styles as Invoice

function CreateComplaint() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: 1, 
    priority: 'Low',
    residentId: '' 
  });
  
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [photoFile, setPhotoFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    
    fetch('http://localhost:5073/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        categoryId: parseInt(formData.categoryId),
        residentId: parseInt(formData.residentId) || 1
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.id) {
        setSuccessMessage("Complaint generated successfully.");
        
        // Upload photo if selected
        if (photoFile) {
          const formData = new FormData();
          formData.append('file', photoFile);
          fetch(`http://localhost:5073/api/maintenance/${data.id}/photo`, {
            method: 'POST',
            body: formData
          }).then(() => {
            setTimeout(() => navigate('/maintenance/complaints'), 1500);
          }).catch(() => {
            setTimeout(() => navigate('/maintenance/complaints'), 1500);
          });
        } else {
          setTimeout(() => navigate('/maintenance/complaints'), 1500);
        }
      } else {
        setErrorMessage('Failed to create complaint');
      }
    })
    .catch(err => {
        console.error(err);
        setErrorMessage("Unable to connect to the server. Please try again.");
    });
  };

  return (
    <div className="payment-page">
      <MaintenanceSidebar activePage="create" />
      
      <main className="payment-content">
        <header className="payment-header">
          <div>
            <p className="page-label">MAINTENANCE MANAGEMENT</p>
            <h1>New Complaint</h1>
            <p className="page-description">
              Submit a new maintenance request or complaint.
            </p>
          </div>
        </header>

        <section className="generate-invoice-panel">
          <div className="generate-form-header">
            <h2>Complaint Details</h2>
            <p>Enter the resident, apartment and complaint details.</p>
          </div>

          {successMessage && (
            <div className="invoice-message success-message">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="invoice-message error-message">
              {errorMessage}
            </div>
          )}

          <form className="generate-invoice-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              
              <div className="form-group">
                <label>Resident ID</label>
                <input 
                  type="number" 
                  name="residentId"
                  value={formData.residentId}
                  onChange={handleChange}
                  placeholder="Enter resident ID"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select 
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    border: '1px solid #dfe2dd',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#17212b',
                    fontSize: '14px',
                    outline: 'none',
                    transition: '0.2s',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="1">Plumbing</option>
                  <option value="2">Electrical</option>
                  <option value="3">Air Conditioning</option>
                  <option value="4">Cleaning</option>
                  <option value="5">Security</option>
                  <option value="6">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select 
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    border: '1px solid #dfe2dd',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#17212b',
                    fontSize: '14px',
                    outline: 'none',
                    transition: '0.2s',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  name="title"
                  required 
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Bathroom water leakage"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <textarea 
                  name="description"
                  required 
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the issue in detail..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    border: '1px solid #dfe2dd',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#17212b',
                    fontSize: '14px',
                    outline: 'none',
                    transition: '0.2s',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                ></textarea>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Attach Photo (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setPhotoFile(e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '8px 0',
                    color: '#17212b',
                    fontSize: '14px'
                  }}
                />
              </div>

            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate('/maintenance/complaints')}>
                Cancel
              </button>

              <button type="submit" className="generate-btn" style={{
                  padding: '11px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#0f172a',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
              }}>
                Generate Complaint
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default CreateComplaint;
