import React, { useState, useEffect } from 'react';
import API_BASE_URL from "./apiConfig";
import Orders from "./components/Orders";
import LandForm from "./components/LandForm";
import ComplaintForm from "./components/ComplaintForm";
import './UserProfile.css';
import { useTranslation } from "react-i18next";

const UserProfile = ({ user, location }) => {
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState(null);
  const [subsidies, setSubsidies] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [landRecord, setLandRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [ordersTab, setOrdersTab] = useState('pending');
  const [isEditingLand, setIsEditingLand] = useState(false);
  const [editingComplaintId, setEditingComplaintId] = useState(null);
  const [tempComplaint, setTempComplaint] = useState({ subject: '', description: '' });
  const [cStartDate, setCStartDate] = useState("");
  const [cEndDate, setCEndDate] = useState("");

  useEffect(() => {
    if (user?.id || user?._id) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    const userId = user?.id || user?._id || user?.user?.id || user?.user?._id;
    if (!userId) {
        console.error("No User ID found for fetching data");
        setLoading(false);
        return;
    }

    try {
      const fetchWithCatch = async (url, fallback = []) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return fallback;
          const data = await res.json();
          return data;
        } catch (e) {
          console.warn(`Failed to fetch ${url}:`, e);
          return fallback;
        }
      };

      const [profileDataObj, subsidiesData, ordersData, complaintsData, landData] = await Promise.all([
        fetchWithCatch(`${API_BASE_URL}/api/user/profile/${userId}`, { user: null }),
        fetchWithCatch(`${API_BASE_URL}/api/user/subsidies/${userId}`, { subsidies: [] }),
        fetchWithCatch(`${API_BASE_URL}/api/user/orders/${userId}`, { orders: [], cart: [] }),
        fetchWithCatch(`${API_BASE_URL}/api/complaint/user/${userId}`, []),
        fetchWithCatch(`${API_BASE_URL}/api/land/${userId}`, null)
      ]);

      setProfileData(profileDataObj?.user);
      setSubsidies(subsidiesData?.subsidies || []);
      setOrders(Array.isArray(ordersData?.orders) ? ordersData.orders : []);
      setCart(ordersData?.cart || []);
      setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
      setLandRecord(landData);
      setLoading(false);
    } catch (error) {
      console.error('Critical error in UserProfile fetch:', error);
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB');
  };

  if (loading) {
    return <div className="loading">{t("loading") || "Loading..."}</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h2>{t("user_profile_header") || "User Profile"}</h2>
      </div>

      <div className="profile-tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          {t("profile") || "Profile"}
        </button>
        {user?.role !== 'farmer' && user?.role !== 'dept_admin' && user?.role !== 'admin' && (
          <button
            className={activeTab === 'subsidy' ? 'active' : ''}
            onClick={() => setActiveTab('subsidy')}
          >
            {t("subsidy") || "Subsidy"}
          </button>
        )}
        {user?.role !== 'dept_admin' && user?.role !== 'admin' && (
          <button
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            {t("orders") || "Orders"}
          </button>
        )}
        <button
          className={activeTab === 'complaints' ? 'active' : ''}
          onClick={() => setActiveTab('complaints')}
        >
          {t("complaints") || "Complaints"}
        </button>
        {user?.role !== 'dept_admin' && user?.role !== 'admin' && (
          <button
            className={activeTab === 'land' ? 'active' : ''}
            onClick={() => setActiveTab('land')}
          >
            {t("land_records") || "Land Records"}
          </button>
        )}
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-info">
            <div className="info-card">
              <h3>{t("personal_info") || "Personal Information"}</h3>
              <div className="info-row">
                <span className="label">{t("name_label") || "Name:"}</span>
                <span className="value">{profileData?.username || user?.username || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">{t("email_label") || "Email:"}</span>
                <span className="value">{profileData?.email || user?.email || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="label">{t("phone_label") || "Contact Number:"}</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <span className="value">{profileData?.phone || user?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {location && (
              <div className="info-card">
                <h3>{t("location") || "Location"}</h3>
                <div className="info-row">
                  <span className="label">{t("latitude") || "Latitude:"}</span>
                  <span className="value">{location.latitude.toFixed(6)}</span>
                </div>
                <div className="info-row">
                  <span className="label">{t("longitude") || "Longitude:"}</span>
                  <span className="value">{location.longitude.toFixed(6)}</span>
                </div>
                {profileData?.location?.address && (
                  <div className="info-row">
                    <span className="label">{t("address_label") || "Address:"}</span>
                    <span className="value">{profileData.location.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'subsidy' && (
          <div className="subsidy-section">
            <h3>{t("subsidy_info") || "Subsidy Information"}</h3>
            {subsidies.length === 0 ? (
              <p className="no-data">{t("no_subsidies") || "No subsidy applications found."}</p>
            ) : (
              <div className="subsidy-list">
                {subsidies.map((subsidy, index) => (
                  <div key={index} className="subsidy-card">
                    <h4>{subsidy.schemeName}</h4>
                    <div className="subsidy-details">
                      <div className="detail-row">
                        <span className="label">{t("conf_date") || "Confirmation Date:"}</span>
                        <span className="value">{formatDate(subsidy.confirmationDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">{t("appr_date") || "Approval Date:"}</span>
                        <span className="value">{formatDate(subsidy.approvalDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">{t("val_date") || "Validation Date:"}</span>
                        <span className="value">{formatDate(subsidy.validationDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">{t("ren_date") || "Renewal Date:"}</span>
                        <span className="value">{formatDate(subsidy.renewalDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">{t("status") || "Status:"}</span>
                        <span className={`status-badge status-${subsidy.status}`}>
                          {subsidy.status ? t(subsidy.status.toLowerCase()) : subsidy.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <Orders user={user} />
          </div>
        )}

        {activeTab === 'complaints' && (() => {
          const filteredComplaints = complaints.filter(c => {
              if (!cStartDate && !cEndDate) return true;
              const cDate = new Date(c.createdAt || c.submittedDate || Date.now());
              if (cStartDate && cDate < new Date(cStartDate)) return false;
              if (cEndDate) {
                  const endD = new Date(cEndDate);
                  endD.setHours(23, 59, 59, 999);
                  if (cDate > endD) return false;
              }
              return true;
          });
          return (
          <div className="complaints-section">
            <h3>{t("my_complaints") || "My Complaints"}</h3>
            <ComplaintForm user={user} onSuccess={fetchUserData} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>{t("comp_status_header") || "Complaint Status"}</h3>
                <div className="filters" style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(255,255,255,0.06)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)", color: "#c8ddef" }}>
                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>{t("from") || "From"}: <input type="date" value={cStartDate} onChange={(e) => setCStartDate(e.target.value)} style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }} /></label>
                    <label style={{ fontSize: "14px", fontWeight: "bold" }}>{t("to") || "To"}: <input type="date" value={cEndDate} onChange={(e) => setCEndDate(e.target.value)} style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }} /></label>
                </div>
            </div>

            {filteredComplaints.length === 0 ? (
              <p className="no-data">No complaints found for the selected dates.</p>
            ) : (
              <div className="complaints-list">
                {filteredComplaints.map((complaint, index) => (
                  <div key={index} className="complaint-card">
                    <div className="complaint-header">
                      <span className="complaint-id">{t("comp_id") || "Complaint ID:"} {complaint._id || complaint.complaintId}</span>
                      <span className={`status-badge status-${complaint.status}`}>
                        {complaint.status ? t(complaint.status.toLowerCase()) : complaint.status}
                      </span>
                    </div>
                    <div className="complaint-details">
                      <h4>{complaint.subject}</h4>
                      <p>{complaint.description}</p>
                      
                      {complaint.status === 'Pending' && (
                         <button 
                            className="verify-small-btn" 
                            style={{ marginBottom: '10px' }}
                            onClick={() => {
                                const newDesc = prompt("Update your complaint description:", complaint.description);
                                if (newDesc) {
                                    fetch(`${API_BASE_URL}/api/complaint/${complaint._id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ description: newDesc })
                                    }).then(() => fetchUserData());
                                }
                            }}
                         >
                            ✏️ {t("edit_comp") || "Edit Complaint"}
                         </button>
                      )}

                      <div className="complaint-dates">
                        <span>{t("submitted_at") || "Submitted:"} {formatDate(complaint.createdAt || complaint.submittedDate)}</span>
                        {complaint.status === 'Resolved' && (
                          <span>{t("resolved_at") || "Resolved:"} {formatDate(complaint.updatedAt || complaint.resolutionDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )})()}

        {activeTab === 'land' && (
          <div className="land-section">
            <h3>{t("land_records") || "Land Records"}</h3>

            {/* KYC Resources Section */}
            <div className="kyc-resources" style={{ background: '#e7f3ff', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #007bff' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#0056b3' }}>{t("aadhar_kyc_links")}</h5>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <a href="https://myaadhaar.uidai.gov.in/verifyAadhaar" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#007bff', color: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}>{t("verify_aadhar_official")}</a>
                    <a href="https://myaadhaar.uidai.gov.in/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#28a745', color: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}>{t("update_aadhar_official")}</a>
                    <a href="https://myaadhaar.uidai.gov.in/offline-ekyc" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#6c757d', color: 'white', padding: '8px 12px', borderRadius: '4px', fontSize: '12px' }}>{t("offline_kyc_official")}</a>
                </div>
            </div>

            {!landRecord || (Array.isArray(landRecord) && landRecord.length === 0) ? (
              <div className="land-edit-container">
                  <p className="no-data">{t("no_land_records_msg") || "No land records found for this account."}</p>
                  <button className="add-member-btn" onClick={() => setIsEditingLand(true)}>{t("add_land_record") || "+ Add Land Record"}</button>
                  {isEditingLand && (
                      <LandForm 
                        user={user} 
                        onSuccess={() => {
                            setIsEditingLand(false);
                            fetchUserData();
                        }} 
                      />
                  )}
              </div>
            ) : !isEditingLand ? (
              <div className="info-card land-card">
                  <h4>{t("prop_details") || "Property Details"}</h4>
                  <div className="info-row"><span className="label">{t("owner_label") || "Owner:"}</span> <span className="value">{landRecord.ownerName}</span></div>
                  <div className="info-row"><span className="label">{t("land_no_label") || "Land No:"}</span> <span className="value">{landRecord.landNumber || 'N/A'}</span></div>
                  <div className="info-row"><span className="label">{t("survey_no_label") || "Survey No:"}</span> <span className="value">{landRecord.surveyNumber}</span></div>
                  <div className="info-row"><span className="label">{t("area_label") || "Area:"}</span> <span className="value">{landRecord.area} {t("acres") || "Acres"}</span></div>
                  <div className="info-row"><span className="label">{t("soil_type_label") || "Soil Type:"}</span> <span className="value">{landRecord.soilType ? t(landRecord.soilType.toLowerCase()) : 'N/A'}</span></div>
                  <div className="info-row"><span className="label">{t("address_label") || "Address:"}</span> <span className="value">{landRecord.address || 'N/A'}, {landRecord.village}, {landRecord.city || ''}, {landRecord.pincode || ''}</span></div>
                  <div className="info-row"><span className="label">{t("district_label") || "District:"}</span> <span className="value">{landRecord.district}</span></div>
                  
                  {landRecord.holders && landRecord.holders.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                        <h5>{t("joint_holders") || "Joint Holders"}</h5>
                        <div className="holders-list">
                            {landRecord.holders.map((h, i) => (
                                <div key={i} className="holder-tag">{h.name} ({h.relation})</div>
                            ))}
                        </div>
                    </div>
                  )}

                  <button 
                    className="view-invoice-btn" 
                    style={{ background: '#007bff', marginTop: '15px' }}
                    onClick={() => setIsEditingLand(true)}
                  >
                    ✏️ {t("edit_land_details") || "Edit Land Details"}
                  </button>
              </div>
            ) : (
                <div className="land-edit-container">
                    <button className="cancel-btn" onClick={() => setIsEditingLand(false)} style={{ marginBottom: '10px' }}>{t("cancel_edit") || "Cancel Edit"}</button>
                    <LandForm 
                        user={user} 
                        existingData={landRecord} 
                        onSuccess={() => {
                            setIsEditingLand(false);
                            fetchUserData();
                        }} 
                    />
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;

