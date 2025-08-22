// client/src/popups/EditBookPopup.jsx
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateBook } from "../store/slices/bookSlice";
import { closeEditBookPopup } from "../store/slices/popupSlice";

const EditBookPopup = ({ book, onClose }) => {
  const dispatch = useDispatch();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const [genre, setGenre] = useState("");

  useEffect(() => {
    if (book) {
      setTitle(book.title || "");
      setAuthor(book.author || "");
      setPublisher(book.publisher || "");
      setIsbn(book.ISBN || "");
      setPublicationDate(
        book.publishedDate
          ? new Date(book.publishedDate).toISOString().split("T")[0]
          : ""
      );
      setQuantity(book.quantity || "");
      setDescription(book.description || "");
      setPrice(book.price || "");
      setAvailable(book.availability ?? true);
      setGenre(book.genre || "");
    }
  }, [book]);

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    const updatedBook = {
      title,
      author,
      publisher,
      ISBN: isbn,
      publishedDate: new Date(publicationDate),
      quantity: Number(quantity),
      description,
      price: Number(price),
      availability: available,
      genre,
    };

    try {
      await dispatch(updateBook({ id: book._id, updatedData: updatedBook }));
      handleCancel(); // close after successful update
    } catch (error) {
      console.error("Failed to update book:", error);
    }
  };

  const handleCancel = () => {
    dispatch(closeEditBookPopup()); // ✅ properly closes popup
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4">Edit Book</h3>
          <form onSubmit={handleUpdateBook} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Book Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border-2 border-black rounded-md"
                required
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-4 py-2 border-2 border-black rounded-md"
                required
              />
            </div>

            {/* Publisher */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Publisher
              </label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full px-4 py-2 border-2 border-black rounded-md"
                required
              />
            </div>

            {/* ISBN */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ISBN
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="w-full px-4 py-2 border-2 border-black rounded-md"
                required
              />
            </div>

            {/* Publication Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Publication Date
              </label>
              <input
                type="date"
                value={publicationDate}
                onChange={(e) => setPublicationDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-black rounded-md"
                required
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 border-2 border-black rounded-md"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border-2 border-black rounded-md"
                rows={4}
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2 border-2 border-black rounded-md"
                required
              />
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Availability
              </label>
              <select
                value={available}
                onChange={(e) => setAvailable(e.target.value === "true")}
                className="w-full px-4 py-2 border-2 border-black rounded-md"
              >
                <option value="true">Available</option>
                <option value="false">Not Available</option>
              </select>
            </div>

            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-4 py-2 border-2 border-black rounded-md"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Update Book
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBookPopup;
