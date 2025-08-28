import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addBook } from "../store/slices/bookSlice";

const AddBookPopup = ({ onClose }) => {
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

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setPublisher("");
    setIsbn("");
    setPublicationDate("");
    setQuantity("");
    setDescription("");
    setPrice("");
    setAvailable(true);
    setGenre("");
  };

  const handleAddBook = async (e) => {
    e.preventDefault();

    const bookData = {
      title,
      author,
      description,
      price: Number(price),
      quantity: Number(quantity),
      genre,
      publishedDate: new Date(publicationDate),
      publisher,
      ISBN: isbn,
      available,
    };

    try {
      await dispatch(addBook(bookData));
      resetForm();
      onClose(); // Close popup after adding
    } catch (error) {
      console.error("Failed to add book:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4">Add Book</h3>
          <form onSubmit={handleAddBook} className="space-y-4">
            {/* Book Title */}
            <div>
              <label className="block text-sm font-medium">Book Title</label>
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
              <label className="block text-sm font-medium">Author</label>
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
              <label className="block text-sm font-medium">Publisher</label>
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
              <label className="block text-sm font-medium">ISBN</label>
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
              <label className="block text-sm font-medium">Publication Date</label>
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
              <label className="block text-sm font-medium">Quantity</label>
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
              <label className="block text-sm font-medium">Description</label>
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
              <label className="block text-sm font-medium">Price</label>
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
              <label className="block text-sm font-medium">Availability</label>
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
              <label className="block text-sm font-medium">Genre</label>
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
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
              >
                Add Book
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBookPopup;
