import React, { useState } from 'react';
import { X, Calendar, CheckCircle, Mail, Building, User, FileText } from 'lucide-react';
import Button from '../../Button';
import axiosInstance from '../../../services/axiosInstance';
import './styles.scss';

const RequestDemoModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.company.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await axiosInstance.post('/api/demo-requests', formData);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit demo request:', err);
      setError(err.response?.data?.message || 'Failed to submit request to backend. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ name: '', email: '', company: '', notes: '' });
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="modalOverlay demoModalOverlay" onClick={onClose}>
      <div className="modalContent demoModalContent" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="demoForm">
            <div className="modalHeader">
              <div className="iconWrapper demo">
                <Calendar size={32} />
              </div>
              <h2>Request a Demo</h2>
              <p className="subtitle">Schedule a personalized walkthrough of Komunas with our team.</p>
            </div>

            <div className="modalBody">
              {error && <div className="formError">{error}</div>}

              <div className="formGroup">
                <label htmlFor="name">Full Name *</label>
                <div className="inputWrapper">
                  <User size={18} className="inputIcon" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="formGroup">
                <label htmlFor="email">Work Email *</label>
                <div className="inputWrapper">
                  <Mail size={18} className="inputIcon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="jane@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="formGroup">
                <label htmlFor="company">Company / Organization *</label>
                <div className="inputWrapper">
                  <Building size={18} className="inputIcon" />
                  <input
                    type="text"
                    id="company"
                    name="company"
                    placeholder="Acme Corp"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="formGroup">
                <label htmlFor="notes">Notes / Specific Requirements (Optional)</label>
                <div className="inputWrapper textWrapper">
                  <FileText size={18} className="inputIcon textareaIcon" />
                  <textarea
                    id="notes"
                    name="notes"
                    placeholder="Tell us about the USCIS forms or streams you need to monitor..."
                    value={formData.notes}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="modalFooter">
              <Button variant="cancel" type="button" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                Submit Request
              </Button>
            </div>
          </form>
        ) : (
          <div className="successContent">
            <div className="successIcon">
              <CheckCircle size={64} />
            </div>
            <h2>Demo Request Received!</h2>
            <p className="successMessage">
              Thank you, <strong>{formData.name}</strong>. Your request has been compiled and routed to <strong>msen@linqra.com</strong>.
            </p>
            <p className="subMessage">
              Our product intelligence team has been notified and will reach out to you shortly to schedule your session.
            </p>
            <div className="successFooter">
              <Button variant="primary" onClick={handleReset}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDemoModal;
