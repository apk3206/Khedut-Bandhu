import React, { useState, useEffect } from "react";
import API_BASE_URL from "../apiConfig";
import "./AddProduct.css";

const AddProduct = ({ onSuccess, onCancel, user, product }) => {
    const validCategories = ["Seed", "Pesticide", "Tool", "Other"];
    const isDeptValid = user?.role === "dept_admin" && validCategories.includes(user.department);

    const [formData, setFormData] = useState({
        name: "",
        category: isDeptValid ? user.department : "Seed",
        price: "",
        stock: "",
        description: "",
        imageUrl: "",
        type: "",
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || "",
                category: product.category || (isDeptValid ? user.department : "Seed"),
                price: product.price || "",
                stock: product.stock || "",
                description: product.description || "",
                imageUrl: product.imageUrl || "",
                type: product.type || "",
            });
        }
    }, [product, isDeptValid, user.department]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = product
            ? `${API_BASE_URL}/api/products/${product._id}`
            : `${API_BASE_URL}/api/products`;
        const method = product ? "PUT" : "POST";

        try {
            console.log(`[V2] Fetching ${method} ${url}`);
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                alert(product ? "Product Updated Successfully! (V2)" : "Product Added Successfully! (V2)");
                onSuccess();
            } else {
                const text = await res.text().catch(() => "No response body");
                alert(`Failed to ${product ? "update" : "add"} product (V2)!\n\nStatus: ${res.status}\nURL: ${url}\nMethod: ${method}\n\nServer says: ${text.substring(0, 100)}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Network Error (V2): ${err.message}\nURL: ${url}`);
        }
    };

    return (
        <div className="add-product-form">
            <h3>{product ? "Edit Product" : "Add New Product"}</h3>
            <form onSubmit={handleSubmit}>
                <label>Name</label>
                <input name="name" value={formData.name} onChange={handleChange} required />

                <label>Category</label>
                <select
                    name="category"
                    onChange={handleChange}
                    value={formData.category} // Controlled component
                    disabled={isDeptValid} // Lock ONLY if Dept matches a valid category
                    style={isDeptValid ? { backgroundColor: "#e9ecef" } : {}}
                >
                    <option value="Seed">Seed</option>
                    <option value="Pesticide">Pesticide</option>
                    <option value="Tool">Tool</option>
                    <option value="Other">Other</option>
                </select>

                <div className="row">
                    <div>
                        <label>Price (₹)</label>
                        <input name="price" type="number" value={formData.price} onChange={handleChange} required />
                    </div>
                    <div>
                        <label>Stock</label>
                        <input name="stock" type="number" value={formData.stock} onChange={handleChange} required />
                    </div>
                </div>

                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required></textarea>

                <label>Image URL (Optional)</label>
                <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="/products/image.png" />

                <div className="buttons">
                    <button type="submit" className="save-btn">{product ? "Update Product" : "Save Product"}</button>
                    <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;
