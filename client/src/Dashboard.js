import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostListingForm from './PostListingForm';
import ListingDetailModal from './ListingDetailModal';
import './Dashboard.css';

function Dashboard({ name, email, onLogout }) {
    const [showForm, setShowForm] = useState(false);
    const [listings, setListings] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredResults, setFilteredResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedListing, setSelectedListing] = useState(null);
    const [sortByPrice, setSortByPrice] = useState(''); // State for dropdown value

    useEffect(() => {
        const fetchListings = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('/search?query=');
                setListings(response.data.listings || []);
                setError('');
            } catch (error) {
                console.error('Error fetching listings:', error);
                setError('Failed to load listings. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchListings();
    }, []);

    // Function to sort listings by price
    const sortListingsByPrice = (list) => {
        if (sortByPrice === 'low') {
            return [...list].sort((a, b) => a.pricePerDay - b.pricePerDay);
        } else if (sortByPrice === 'high') {
            return [...list].sort((a, b) => b.pricePerDay - a.pricePerDay);
        }
        return list;
    };

    // Handle search and sort
    useEffect(() => {
        let results = listings;

        if (searchQuery.trim()) {
            results = listings.filter(listing =>
                listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.size?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.itemType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                listing.condition?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredResults(sortListingsByPrice(results));
    }, [searchQuery, listings, sortByPrice]);

    const handleListingClick = (listing) => {
        setSelectedListing(listing);
    };

    const handleCloseModal = () => {
        setSelectedListing(null);
    };

    useEffect(() => {
        if (!window.Square) {
            const script = document.createElement('script');
            script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
            script.async = true;
            script.onload = () => {
                console.log('Square SDK loaded');
            };
            script.onerror = () => {
                console.error('Failed to load Square SDK');
            };
            document.body.appendChild(script);

            return () => {
                document.body.removeChild(script);
            };
        }
    }, []);

    const renderPlaceholderContent = () => {
        const placeholders = [
            {
                id: 'placeholder-1',
                title: 'Blue Denim Jacket',
                size: 'M',
                itemType: 'Jacket',
                pricePerDay: '5.99',
                imageURL: 'https://via.placeholder.com/300x200?text=Denim+Jacket',
                condition: 'Like new',
                washInstructions: 'Machine wash cold',
                startDate: new Date(2023, 5, 1).toISOString(),
                endDate: new Date(2023, 8, 30).toISOString()
            },
            {
                id: 'placeholder-2',
                title: 'Black Jeans',
                size: 'L',
                itemType: 'Jeans',
                pricePerDay: '3.50',
                imageURL: 'https://via.placeholder.com/300x200?text=Black+Jeans',
                condition: 'Good',
                washInstructions: 'Machine wash cold, tumble dry low',
                startDate: new Date(2023, 5, 1).toISOString(),
                endDate: new Date(2023, 8, 30).toISOString()
            },
            {
                id: 'placeholder-3',
                title: 'Summer Dress',
                size: 'S',
                itemType: 'Dress',
                pricePerDay: '6.00',
                imageURL: 'https://via.placeholder.com/300x200?text=Summer+Dress',
                condition: 'New with tags',
                washInstructions: 'Hand wash only',
                startDate: new Date(2023, 5, 1).toISOString(),
                endDate: new Date(2023, 8, 30).toISOString()
            }
        ];

        return (
            <div className="listings-grid">
                {placeholders.map((item) => (
                    <div
                        key={item.id}
                        className="listing-card"
                        onClick={() => handleListingClick(item)}
                    >
                        <img src={item.imageURL} alt={item.title} />
                        <div className="listing-info">
                            <h3>{item.title}</h3>
                            <p><strong>Size:</strong> {item.size}</p>
                            <p><strong>Type:</strong> {item.itemType}</p>
                            <p><strong>${item.pricePerDay}/day</strong></p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="dashboard">
            <h2>Welcome, {name}!</h2>

            {/* Search and Sort Section */}
            <div className="search-sort-section">
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="Search by title, size, type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="sort-options">
                    <select
                        className="sort-dropdown"
                        value={sortByPrice}
                        onChange={(e) => setSortByPrice(e.target.value)}
                    >
                        <option value="">Sort by Price</option>
                        <option value="low">Price: Low to High</option>
                        <option value="high">Price: High to Low</option>
                    </select>
                </div>
            </div>

            <button className="post-listing-btn" onClick={() => setShowForm(!showForm)}>
                {showForm ? "Cancel" : "Post a Listing"}
            </button>

            {!showForm && (
                <>
                    {isLoading ? (
                        <p className="status-message">Loading listings...</p>
                    ) : error ? (
                        <div className="error-container">
                            <p className="error-message">{error}</p>
                            {renderPlaceholderContent()}
                        </div>
                    ) : filteredResults.length > 0 ? (
                        <div className="listings-grid">
                            {filteredResults.map((listing) => (
                                <div
                                    key={listing.id}
                                    className="listing-card"
                                    onClick={() => handleListingClick(listing)}
                                >
                                    <img
                                        src={listing.imageURL || "https://via.placeholder.com/300x200?text=No+Image"}
                                        alt={listing.title}
                                    />
                                    <div className="listing-info">
                                        <h3>{listing.title}</h3>
                                        <p><strong>Size:</strong> {listing.size}</p>
                                        <p><strong>Type:</strong> {listing.itemType}</p>
                                        <p><strong>${listing.pricePerDay}/day</strong></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : searchQuery ? (
                        <p className="status-message">No items matching "{searchQuery}" found.</p>
                    ) : (
                        <div>
                            <p className="status-message">No listings available. Be the first to post!</p>
                            {renderPlaceholderContent()}
                        </div>
                    )}
                </>
            )}

            {selectedListing && (
                <ListingDetailModal
                    listing={selectedListing}
                    onClose={handleCloseModal}
                    userEmail={email}
                />
            )}

            <button className="logout-btn" onClick={onLogout}>Log Out</button>
        </div>
    );
}

export default Dashboard;