import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from "recharts";
import { useTranslation } from "react-i18next";

const AnalyticsDashboard = ({ stats, userRole }) => {
    const { t } = useTranslation();
    const [topStats, setTopStats] = useState({ totalUsers: 0, totalComplaints: 0, activeListings: 0, totalProducts: 0 });
    const [salesVsStock, setSalesVsStock] = useState([]);
    const [complaintStatus, setComplaintStatus] = useState([]);
    const [marketTrends, setMarketTrends] = useState([]);
    const [availableCrops, setAvailableCrops] = useState([]);
    const [selectedCrops, setSelectedCrops] = useState([]);

    useEffect(() => {
        if (stats) {
            if (stats.topStats) setTopStats(stats.topStats);
            if (stats.salesVsStock) setSalesVsStock(stats.salesVsStock);
            if (stats.complaintStatus) setComplaintStatus(stats.complaintStatus);
            if (stats.trends) {
                setMarketTrends(stats.trends);

                // Extract all unique crops from trend data
                const crops = new Set();
                stats.trends.forEach(item => {
                    Object.keys(item).forEach(key => {
                        if (key !== "month") crops.add(key);
                    });
                });
                const cropList = Array.from(crops);
                setAvailableCrops(cropList);
                // Default to all crops if none selected yet
                if (selectedCrops.length === 0) setSelectedCrops(cropList);
            }
        }
    }, [stats]);

    const handleCropToggle = (crop) => {
        setSelectedCrops(prev =>
            prev.includes(crop) ? prev.filter(c => c !== crop) : [...prev, crop]
        );
    };

    const STATUS_COLORS = {
        "In Progress": "#ffc107",
        "Pending": "#28a745",
        "Rejected": "#dc3545",
        "Resolved": "#007bff"
    };

    const LINE_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#00c49f", "#ffbb28", "#ff8042"];

    return (
        <div className="analytics-dashboard" style={{ padding: "10px", background: "transparent", borderRadius: "15px" }}>
            <h3 style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px", marginBottom: "25px", color: "#444" }}>{t("stat_title")}</h3>

            {/* --- TOP METRICS ROW --- */}
            <div className="top-metrics" style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
                {userRole === "admin" && (
                    <div className="metric-card" style={{ flex: "1 1 200px", background: "white", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                        <p style={{ color: "#666", fontSize: "0.9em", margin: "0 0 5px 0" }}>{t("total_users")}</p>
                        <h2 style={{ color: "#28a745", margin: 0 }}>{topStats.totalUsers}</h2>
                    </div>
                )}
                <div className="metric-card" style={{ flex: "1 1 200px", background: "white", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                    <p style={{ color: "#666", fontSize: "0.9em", margin: "0 0 5px 0" }}>{t("total_complaints")}</p>
                    <h2 style={{ color: "#dc3545", margin: 0 }}>{topStats.totalComplaints}</h2>
                </div>
                <div className="metric-card" style={{ flex: "1 1 200px", background: "white", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                    <p style={{ color: "#666", fontSize: "0.9em", margin: "0 0 5px 0" }}>{t("active_listings")}</p>
                    <h2 style={{ color: "#007bff", margin: 0 }}>{topStats.activeListings}</h2>
                </div>
                <div className="metric-card" style={{ flex: "1 1 200px", background: "white", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
                    <p style={{ color: "#666", fontSize: "0.9em", margin: "0 0 5px 0" }}>{t("total_products")}</p>
                    <h2 style={{ color: "#ffc107", margin: 0 }}>{topStats.totalProducts}</h2>
                </div>
            </div>

            <h4 style={{ color: "#444", marginBottom: "20px" }}>{t("dept_analytics")}</h4>

            <div className="charts-grid" style={{ display: "flex", flexWrap: "wrap", gap: "30px" }}>

                {/* --- BAR CHART: SALES VS STOCK --- */}
                <div className="chart-box" style={{ flex: "1 1 600px", background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 5px 15px rgba(0,0,0,0.05)" }}>
                    <h5 style={{ color: "#555", marginBottom: "15px", fontSize: "0.9em" }}>{t("sales_vs_stock")}</h5>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesVsStock}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip cursor={{ fill: '#fcfcfc' }} />
                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                iconType="rect"
                                height={36}
                                formatter={(value) => t(value.toLowerCase())}
                            />
                            <Bar dataKey="Sales" stackId="a" fill="#28a745" radius={[4, 4, 0, 0]} barSize={25} name={t("sales")} />
                            <Bar dataKey="Stock" stackId="b" fill="#007bff" radius={[4, 4, 0, 0]} barSize={25} style={{ marginLeft: "10px" }} name={t("stock")} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* --- PIE CHART: STATUSES --- */}
                <div className="chart-box" style={{ flex: "1 1 300px", background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 5px 15px rgba(0,0,0,0.05)" }}>
                    <h5 style={{ color: "#555", marginBottom: "15px", fontSize: "0.9em" }}>{t("complaint_status_dist")}</h5>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={complaintStatus}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, value }) => `${value}`}
                                labelLine={true}
                            >
                                {complaintStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#ccc"} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend
                                verticalAlign="bottom"
                                layout="horizontal"
                                align="center"
                                wrapperStyle={{ fontSize: "10px" }}
                                formatter={(value) => t(value.toLowerCase().replace(" ", "_"))}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* --- LINE CHART: PRICE TRENDS --- */}
                <div className="chart-box" style={{ flex: "1 1 100%", background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 5px 15px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <h5 style={{ color: "#555", margin: 0, fontSize: "0.9em" }}>{t("market_price_trends")}</h5>
                        <div className="crop-filter" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.8em", color: "#666" }}>{t("select_crops")}: </span>
                            {availableCrops.map((crop, idx) => (
                                <label key={crop} style={{ fontSize: "0.8em", display: "flex", alignItems: "center", gap: "3px", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedCrops.includes(crop)}
                                        onChange={() => handleCropToggle(crop)}
                                    />
                                    {t(crop.toLowerCase())}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: "350px", width: "100%" }}>
                        {marketTrends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={marketTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #eee" }} />
                                    <Legend verticalAlign="top" height={36} formatter={(value) => t(value.toLowerCase())} />
                                    {selectedCrops.map((crop, index) => (
                                        <Line
                                            key={crop}
                                            type="monotone"
                                            dataKey={crop}
                                            stroke={LINE_COLORS[index % LINE_COLORS.length]}
                                            strokeWidth={3}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 8 }}
                                            connectNulls
                                            name={t(crop.toLowerCase())}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999" }}>
                                {t("wait_live_data")}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- REGIONAL YIELD HEATMAP (SIMULATED) --- */}
                <div className="chart-box" style={{ flex: "1 1 100%", background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 5px 15px rgba(0,0,0,0.05)" }}>
                    <h5 style={{ color: "#555", marginBottom: "15px", fontSize: "0.9em" }}>Regional Production Intensity (Heatmap View)</h5>
                    <div style={{ height: "300px", width: "100%" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={[
                                    { region: "Saurashtra", intensity: 85, color: "#15803d" },
                                    { region: "North Gujarat", intensity: 65, color: "#22c55e" },
                                    { region: "Central Gujarat", intensity: 45, color: "#4ade80" },
                                    { region: "South Gujarat", intensity: 75, color: "#16a34a" },
                                    { region: "Kutch", intensity: 30, color: "#86efac" }
                                ]}
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="region" tick={{ fontSize: 12, fontWeight: 600 }} width={120} />
                                <Tooltip 
                                    cursor={{ fill: '#f8f8f8' }}
                                    formatter={(value) => [`${value}% Intensity`, 'Production']}
                                />
                                <Bar dataKey="intensity" radius={[0, 4, 4, 0]} barSize={35}>
                                    {
                                        [
                                            { region: "Saurashtra", intensity: 85, color: "#15803d" },
                                            { region: "North Gujarat", intensity: 65, color: "#22c55e" },
                                            { region: "Central Gujarat", intensity: 45, color: "#4ade80" },
                                            { region: "South Gujarat", intensity: 75, color: "#16a34a" },
                                            { region: "Kutch", intensity: 30, color: "#86efac" }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p style={{ fontSize: "0.75em", color: "#888", marginTop: "10px", textAlign: "right" }}>* Live sensor data from regional nodal centers</p>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsDashboard;
