import { User, Mail, MapPin, Calendar, Music, Film, Tv, Heart, Edit2 } from "lucide-react";
import { useState } from "react";

export function ProfilePage() {
    const [isEditMode, setIsEditMode] = useState(false);
    const [profile, setProfile] = useState({
        name: "John Doe",
        headline: "Living my best life!",
        email: "john.doe@email.com",
        location: "New York, NY",
        joined: "November 2024",
        status: "Single",
        music: "Rock, Pop, Electronic",
        movies: "Sci-Fi, Action, Comedy",
        tvShows: "Tech shows, Documentaries",
        heroes: "Innovators and Dreamers",
        aboutMe: "Hey there! I'm John, a passionate software engineer from New York. I love coding, solving problems, and building awesome applications. When I'm not working, you can find me exploring the city, listening to music, or hanging out with friends. Always looking to connect with like-minded people!",
        whoToMeet: "Looking to connect with fellow developers, tech enthusiasts, and creative people. If you're passionate about technology and innovation, let's be friends!",
        topCompanies: ["Google", "Microsoft", "Apple", "Amazon", "Meta", "Netflix", "Tesla", "SpaceX"]
    });

    const [editedProfile, setEditedProfile] = useState(profile);

    const handleSave = () => {
        setProfile(editedProfile);
        setIsEditMode(false);
    };

    const handleCancel = () => {
        setEditedProfile(profile);
        setIsEditMode(false);
    };

    const updateCompany = (index: number, value: string) => {
        const newCompanies = [...editedProfile.topCompanies];
        newCompanies[index] = value;
        setEditedProfile({ ...editedProfile, topCompanies: newCompanies });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-6">
            <div className="max-w-6xl mx-auto">

                {/* Edit Mode Toggle */}
                <div className="flex justify-end mb-4">
                    {!isEditMode ? (
                        <button
                            onClick={() => setIsEditMode(true)}
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-all shadow-md"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-all shadow-md"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-all shadow-md"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column - Profile Info */}
                    <div className="space-y-6">

                        {/* Profile Card */}
                        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-400">
                            <div className="text-center mb-6">
                                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg mx-auto mb-4 flex items-center justify-center">
                                    <User className="w-16 h-16 text-white" />
                                </div>
                                {isEditMode ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editedProfile.name}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded mb-2"
                                        />
                                        <input
                                            type="text"
                                            value={editedProfile.headline}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, headline: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded text-sm"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-blue-600 mb-2">{profile.name}</h2>
                                        <p className="text-gray-600">{profile.headline}</p>
                                    </>
                                )}
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Mail className="w-4 h-4 text-blue-500" />
                                    {isEditMode ? (
                                        <input
                                            type="email"
                                            value={editedProfile.email}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                                            className="flex-1 px-2 py-1 border-2 border-blue-300 rounded"
                                        />
                                    ) : (
                                        <span>{profile.email}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <MapPin className="w-4 h-4 text-blue-500" />
                                    {isEditMode ? (
                                        <input
                                            type="text"
                                            value={editedProfile.location}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                                            className="flex-1 px-2 py-1 border-2 border-blue-300 rounded"
                                        />
                                    ) : (
                                        <span>{profile.location}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    <span>Joined {profile.joined}</span>
                                </div>
                            </div>
                        </div>

                        {/* Interests */}
                        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-400">
                            <h3 className="text-blue-600 mb-4 pb-2 border-b-2 border-blue-400">Interests</h3>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-gray-700">
                                        <Music className="w-4 h-4 text-blue-500" />
                                        <span>Music:</span>
                                    </div>
                                    {isEditMode ? (
                                        <input
                                            type="text"
                                            value={editedProfile.music}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, music: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded"
                                        />
                                    ) : (
                                        <p className="text-gray-600 ml-6">{profile.music}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-gray-700">
                                        <Film className="w-4 h-4 text-blue-500" />
                                        <span>Movies:</span>
                                    </div>
                                    {isEditMode ? (
                                        <input
                                            type="text"
                                            value={editedProfile.movies}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, movies: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded"
                                        />
                                    ) : (
                                        <p className="text-gray-600 ml-6">{profile.movies}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-gray-700">
                                        <Tv className="w-4 h-4 text-blue-500" />
                                        <span>TV Shows:</span>
                                    </div>
                                    {isEditMode ? (
                                        <input
                                            type="text"
                                            value={editedProfile.tvShows}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, tvShows: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded"
                                        />
                                    ) : (
                                        <p className="text-gray-600 ml-6">{profile.tvShows}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-gray-700">
                                        <Heart className="w-4 h-4 text-blue-500" />
                                        <span>Heroes:</span>
                                    </div>
                                    {isEditMode ? (
                                        <input
                                            type="text"
                                            value={editedProfile.heroes}
                                            onChange={(e) => setEditedProfile({ ...editedProfile, heroes: e.target.value })}
                                            className="w-full px-3 py-2 border-2 border-blue-300 rounded"
                                        />
                                    ) : (
                                        <p className="text-gray-600 ml-6">{profile.heroes}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* About Me */}
                        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-400">
                            <h2 className="text-blue-600 mb-4 pb-2 border-b-2 border-blue-400">About Me</h2>
                            {isEditMode ? (
                                <textarea
                                    rows={6}
                                    value={editedProfile.aboutMe}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, aboutMe: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-blue-300 rounded resize-none"
                                />
                            ) : (
                                <p className="text-gray-700 leading-relaxed">{profile.aboutMe}</p>
                            )}
                        </div>

                        {/* Who I'd Like to Meet */}
                        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-400">
                            <h2 className="text-blue-600 mb-4 pb-2 border-b-2 border-blue-400">Who I'd Like to Meet</h2>
                            {isEditMode ? (
                                <textarea
                                    rows={4}
                                    value={editedProfile.whoToMeet}
                                    onChange={(e) => setEditedProfile({ ...editedProfile, whoToMeet: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-blue-300 rounded resize-none"
                                />
                            ) : (
                                <p className="text-gray-700 leading-relaxed">{profile.whoToMeet}</p>
                            )}
                        </div>

                        {/* Top 8 Companies */}
                        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-400">
                            <h2 className="text-blue-600 mb-4 pb-2 border-b-2 border-blue-400">Top 8 Companies You Want to Join</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(isEditMode ? editedProfile.topCompanies : profile.topCompanies).map((company, index) => (
                                    <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200 text-center">
                                        {isEditMode ? (
                                            <input
                                                type="text"
                                                value={company}
                                                onChange={(e) => updateCompany(index, e.target.value)}
                                                className="w-full px-2 py-1 border-2 border-blue-300 rounded text-sm text-center"
                                            />
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                                                    <span className="text-white">{index + 1}</span>
                                                </div>
                                                <p className="text-gray-700">{company}</p>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
