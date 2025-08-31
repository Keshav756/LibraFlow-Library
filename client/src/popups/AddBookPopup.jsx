// client/src/components/AddBookPopup.jsx
import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addBook } from "../store/slices/bookSlice";
import { toggleAddBookPopup } from "../store/slices/popupSlice";

const initialFormState = {
  title: "",
  author: "",
  publisher: "",
  isbn: "",
  publicationDate: "",
  quantity: "",
  description: "",
  price: "",
  available: true,
  genre: "",
};

const AddBookPopup = () => {
  const dispatch = useDispatch();
  const { addBookPopup } = useSelector((state) => state.popup);

  const firstInputRef = useRef(null);
  const popupRef = useRef(null);

  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Focus first input when popup opens
  useEffect(() => {
    if (addBookPopup && firstInputRef.current) firstInputRef.current.focus();
    if (!addBookPopup) resetForm();
  }, [addBookPopup]);

  // ESC key closes popup
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") dispatch(toggleAddBookPopup({ open: false }));
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [dispatch]);

  // Focus trap inside modal
  useEffect(() => {
    const handleTab = (e) => {
      if (!addBookPopup) return;
      const focusableEls = popupRef.current.querySelectorAll(
        "input, textarea, select, button"
      );
      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [addBookPopup]);

  // Click outside closes popup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        dispatch(toggleAddBookPopup({ open: false }));
      }
    };
    if (addBookPopup) window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [addBookPopup, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    if (name === "available") val = value === "true";
    if (name === "price" || name === "quantity") val = val.replace(/^0+/, "");
    if (name === "isbn") val = val.replace(/\D/g, "").slice(0, 13);

    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setError("");
    setLoading(false);
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Book title is required.";
    if (!form.author.trim()) return "Author is required.";
    if (!form.publisher.trim()) return "Publisher is required.";
    if (!form.isbn.trim()) return "ISBN is required.";
    if (!/^\d{10}(\d{3})?$/.test(form.isbn.trim()))
      return "ISBN must be 10 or 13 digits.";
    if (!form.publicationDate) return "Publication date is required.";
    if (isNaN(form.quantity) || Number(form.quantity) <= 0)
      return "Quantity must be a positive number.";
    if (isNaN(form.price) || Number(form.price) <= 0)
      return "Price must be positive.";
    if (!form.description.trim()) return "Description is required.";
    if (!form.genre.trim()) return "Genre is required.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      const firstInvalid = popupRef.current.querySelector(
        "input:invalid, textarea:invalid, select:invalid"
      );
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const bookData = {
      title: form.title.trim(),
      author: form.author.trim(),
      publisher: form.publisher.trim(),
      ISBN: form.isbn.trim(),
      publishedDate: form.publicationDate,
      quantity: Number(form.quantity),
      description: form.description.trim(),
      price: Number(form.price),
      available: form.available,
      genre: form.genre.trim(),
    };

    try {
      setLoading(true);
      await dispatch(addBook(bookData)).unwrap();
      resetForm();
      dispatch(toggleAddBookPopup({ open: false }));
    } catch (err) {
      setError(err || "Failed to add book. Please try again.");
      console.error("Add Book Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!addBookPopup) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="addBookTitle"
    >
      <div
        ref={popupRef}
        className="w-full max-w-lg bg-white rounded-lg shadow-lg overflow-hidden"
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <h3 id="addBookTitle" className="text-xl font-bold mb-4 text-black">
            Add Book
          </h3>

          {error && (
            <div
              className="mb-4 p-2 text-sm text-red-700 bg-red-100 border border-red-400 rounded"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "Book Title", name: "title", type: "text", maxLength: 100 },
              { label: "Author", name: "author", type: "text", maxLength: 50 },
              { label: "Publisher", name: "publisher", type: "text", maxLength: 50 },
              { label: "ISBN", name: "isbn", type: "text", maxLength: 13, inputMode: "numeric" },
              { label: "Publication Date", name: "publicationDate", type: "date" },
              { label: "Quantity", name: "quantity", type: "number", min: 1 },
              { label: "Price", name: "price", type: "number", step: 0.01, min: 1 },
              { label: "Genre", name: "genre", type: "text", maxLength: 30 },
            ].map((field, idx) => (
              <div key={field.name}>
                <label className="block text-sm font-medium">{field.label}</label>
                <input
                  ref={idx === 0 ? firstInputRef : null}
                  {...field}
                  value={form[field.name]}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-black rounded-md"
                  required
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-black rounded-md"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Availability</label>
              <select
                name="available"
                value={form.available}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-black rounded-md"
              >
                <option value="true">Available</option>
                <option value="false">Not Available</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => dispatch(toggleAddBookPopup({ open: false }))}
                className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300"
                disabled={loading}
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Book"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBookPopup;
