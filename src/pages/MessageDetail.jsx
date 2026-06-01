import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function MessageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchMessage();
  }, [id]);

  const fetchMessage = async () => {
    try {
      const userRes = await api.post("/auth/me");
      setCurrentUser(userRes.data);

      const res = await api.get(`/messages/${id}`);
      setMessage(res.data);
    } catch (error) {
      console.error("Failed to fetch message:", error);
      navigate("/messages");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!message) return null;

  const isInbox = message.receiver_id === currentUser?.id;

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800 fw-bold">
            <i className="bi bi-envelope-open me-2"></i>Read Message
          </h1>
          <p className="text-muted mb-0 mt-1">
            <Link to="/messages" className="text-decoration-none">
              <i className="bi bi-arrow-left me-1"></i> Back to Messages
            </Link>
          </p>
        </div>
        {isInbox && (
            <Link to={`/messages/new?replyTo=${message.sender_id}&subject=Re: ${encodeURIComponent(message.subject || '')}`} className="btn btn-primary shadow-sm">
                <i className="bi bi-reply me-2"></i> Reply
            </Link>
        )}
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white p-4 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3 shadow-sm"
                style={{ width: "50px", height: "50px", fontSize: "1.5rem" }}
              >
                {isInbox
                  ? message.sender?.name?.charAt(0).toUpperCase()
                  : message.receiver?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h5 className="mb-0 fw-bold">
                  {message.subject || "(No Subject)"}
                </h5>
                <p className="text-muted small mb-0 mt-1">
                  {isInbox ? (
                    <>From: <span className="fw-semibold text-dark">{message.sender?.name}</span></>
                  ) : (
                   <>To: <span className="fw-semibold text-dark">{message.receiver?.name}</span></>
                  )}
                </p>
              </div>
            </div>
            <div className="text-muted small text-end">
              <div>
                <i className="bi bi-calendar3 me-1"></i>
                {new Date(message.created_at).toLocaleDateString()}
              </div>
              <div className="mt-1">
                <i className="bi bi-clock me-1"></i>
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
        <div className="card-body p-4" style={{ minHeight: "300px", whiteSpace: "pre-wrap" }}>
          {message.body}
        </div>
      </div>
    </div>
  );
}
