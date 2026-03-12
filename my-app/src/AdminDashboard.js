import { useEffect, useState } from "react";

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/admin/complaints", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => setComplaints(data));
  }, []);

  const resolveComplaint = async (id) => {
    await fetch(`http://localhost:3000/api/admin/complaint/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Resolved" }),
    });

    setComplaints(prev =>
      prev.map(c =>
        c._id === id ? { ...c, status: "Resolved" } : c
      )
    );
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {complaints.map(c => (
        <div key={c._id} style={{ border: "1px solid #ccc", margin: "10px" }}>
          <p><b>User:</b> {c.userId.username}</p>
          <p><b>Complaint:</b> {c.text}</p>
          <p><b>Status:</b> {c.status}</p>

          {c.status === "Pending" && (
            <button onClick={() => resolveComplaint(c._id)}>
              Mark Resolved
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
