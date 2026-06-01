import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("inbox"); // 'inbox' or 'sent'

  useEffect(() => {
    fetchMessages();
  }, [type]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/messages?type=${type}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-gray-800 fw-bold">
            <i className="bi bi-envelope me-2"></i>Messages
          </h1>
          <p className="text-muted mb-0">Manage your communications</p>
        </div>
        <Link to="/messages/new" className="btn btn-primary shadow-sm">
          <i className="bi bi-pencil-square me-2"></i> Compose
        </Link>
      </div>

      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header bg-white py-3 d-flex flex-row align-items-center justify-content-between border-bottom">
          <ul className="nav nav-tabs card-header-tabs w-100 border-bottom-0">
            <li className="nav-item">
              <button
                className={`nav-link border-0 text-dark ${type === 'inbox' ? 'active fw-bold border-bottom border-primary border-3' : ''}`}
                onClick={() => setType('inbox')}
                style={{ backgroundColor: 'transparent' }}
              >
                Inbox
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link border-0 text-dark ms-2 ${type === 'sent' ? 'active fw-bold border-bottom border-primary border-3' : ''}`}
                onClick={() => setType('sent')}
                style={{ backgroundColor: 'transparent' }}
              >
                Sent
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <i className="bi bi-envelope-open fs-1 mb-3 d-block text-primary opacity-50"></i>
              <p className="fs-5">No messages found here.</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {messages.map((message) => (
                <Link
                  to={`/messages/${message.id}`}
                  key={message.id}
                  className={`list-group-item list-group-item-action p-4 border-bottom ${
                    type === 'inbox' && !message.read_at ? 'bg-light' : ''
                  }`}
                  style={{ backgroundColor: type === 'inbox' && !message.read_at ? '#f0f8ff' : '#fff' }}
                >
                  <div className="d-flex w-100 justify-content-between align-items-center">
                    <div className="d-flex align-items-center mb-1">
                      <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3 shadow-sm"
                        style={{ width: "45px", height: "45px", fontSize: "1.2rem" }}
                      >
                        {type === 'inbox'
                          ? message.sender?.name?.charAt(0).toUpperCase()
                          : message.receiver?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h6 className={`mb-0 ${type === 'inbox' && !message.read_at ? 'fw-bold' : ''}`}>
                          {type === 'inbox' ? message.sender?.name : `To: ${message.receiver?.name}`}
                        </h6>
                        <span className={`text-muted small ${type === 'inbox' && !message.read_at ? 'fw-bold text-dark' : ''}`}>
                          {message.subject || "No Subject"}
                        </span>
                      </div>
                    </div>
                    <small className="text-muted">
                      {new Date(message.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <p className="mb-0 text-truncate text-muted mt-2 ps-5 ms-3" style={{ maxWidth: "85%" }}>
                    {message.body}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
