import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

export default function MessageForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const initialReplyTo = searchParams.get("replyTo") || "";
  const initialSubject = searchParams.get("subject") || "";

  const [formData, setFormData] = useState({
    receiver_id: initialReplyTo,
    subject: initialSubject,
    body: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/messages", formData);
      toast.success("Message sent successfully!");
      navigate("/messages?type=sent");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800 fw-bold">
            <i className="bi bi-pencil-square me-2"></i>Compose Message
          </h1>
          <p className="text-muted mb-0">Send a new message to any user</p>
        </div>
        <button
          onClick={() => navigate("/messages")}
          className="btn btn-outline-secondary shadow-sm"
        >
          <i className="bi bi-x-lg me-2"></i> Cancel
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label text-muted fw-bold">To <span className="text-danger">*</span></label>
              <select
                className="form-select bg-light border-0"
                required
                value={formData.receiver_id}
                onChange={(e) =>
                  setFormData({ ...formData, receiver_id: e.target.value })
                }
              >
                <option value="">Select Recipient...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role?.replace('_', ' ') || 'User'})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label text-muted fw-bold">Subject</label>
              <input
                type="text"
                className="form-control bg-light border-0"
                placeholder="Enter message subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-muted fw-bold">Message <span className="text-danger">*</span></label>
              <textarea
                className="form-control bg-light border-0"
                rows="8"
                required
                placeholder="Type your message here..."
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
              ></textarea>
            </div>

            <div className="d-flex justify-content-end mt-4">
              <button
                type="submit"
                className="btn btn-primary px-4 shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
