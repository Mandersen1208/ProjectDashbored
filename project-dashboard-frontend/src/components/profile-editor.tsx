import { User, Mail, MapPin, Calendar, Music, Film, Tv, Heart, Edit2, Save, X } from "lucide-react";
import { useState } from "react";

export function ProfileEditor() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    headline: "Living my best life!",
    email: "john.doe@email.com",
    location: "New York, NY",
    status: "Single",
    music: "Rock, Pop, Electronic",
    movies: "Sci-Fi, Action, Comedy",
    tvShows: "Tech shows, Documentaries",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Edit Mode Toggle */}
        <div className="flex justify-end mb-4">
          {!isEditMode ? (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-all shadow-md"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-all shadow-md"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-all shadow-md"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* MySpace Classic Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="bg-white rounded-lg shadow-md p-4 border-2 border-blue-400">
              <div className="text-center mb-4">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
                {isEditMode ? (
                  <>
                    <input
                      type="text"
                      value={editedProfile.name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                      className="w-full text-center mb-2 px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={editedProfile.headline}
                      onChange={(e) => setEditedProfile({ ...editedProfile, headline: e.target.value })}
                      className="w-full text-center px-3 py-2 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                      placeholder="Your headline..."
                    />
                  </>
                ) : (
                  <>
                    <h2 className="text-blue-600">{profile.name}</h2>
                    <p className="text-gray-600">"{profile.headline}"</p>
                  </>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg shadow-md p-4 border-2 border-blue-400">
              <h3 className="text-blue-600 mb-3 pb-2 border-b-2 border-blue-400">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  {isEditMode ? (
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                      className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    />
                  ) : (
                    <span>{profile.email}</span>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedProfile.location}
                      onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                      className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    />
                  ) : (
                    <span>{profile.location}</span>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Member since 2025</span>
                </div>
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  {isEditMode ? (
                    <select
                      value={editedProfile.status}
                      onChange={(e) => setEditedProfile({ ...editedProfile, status: e.target.value })}
                      className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    >
                      <option>Single</option>
                      <option>In a Relationship</option>
                      <option>Married</option>
                      <option>It's Complicated</option>
                    </select>
                  ) : (
                    <span>{profile.status}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="bg-white rounded-lg shadow-md p-4 border-2 border-blue-400">
              <h3 className="text-blue-600 mb-3 pb-2 border-b-2 border-blue-400">Interests</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Music className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600">Music:</span>
                  </div>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedProfile.music}
                      onChange={(e) => setEditedProfile({ ...editedProfile, music: e.target.value })}
                      className="w-full ml-6 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    />
                  ) : (
                    <p className="text-gray-700 ml-6">{profile.music}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Film className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600">Movies:</span>
                  </div>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedProfile.movies}
                      onChange={(e) => setEditedProfile({ ...editedProfile, movies: e.target.value })}
                      className="w-full ml-6 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    />
                  ) : (
                    <p className="text-gray-700 ml-6">{profile.movies}</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tv className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-600">TV Shows:</span>
                  </div>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedProfile.tvShows}
                      onChange={(e) => setEditedProfile({ ...editedProfile, tvShows: e.target.value })}
                      className="w-full ml-6 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    />
                  ) : (
                    <p className="text-gray-700 ml-6">{profile.tvShows}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* About Me */}
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-400">
              <h2 className="text-blue-600 mb-4 pb-2 border-b-2 border-blue-400">About Me</h2>
              <textarea
                rows={6}
                value={isEditMode ? editedProfile.aboutMe : profile.aboutMe}
                onChange={(e) => setEditedProfile({ ...editedProfile, aboutMe: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-400 transition-all resize-none"
                readOnly={!isEditMode}
              />
            </div>

            {/* Who I'd Like to Meet */}
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-400">
              <h2 className="text-blue-600 mb-4 pb-2 border-b-2 border-blue-400">Who I'd Like to Meet</h2>
              <textarea
                rows={4}
                value={isEditMode ? editedProfile.whoToMeet : profile.whoToMeet}
                onChange={(e) => setEditedProfile({ ...editedProfile, whoToMeet: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-400 transition-all resize-none"
                readOnly={!isEditMode}
              />
            </div>

            {/* Top 8 Companies */}
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-400">
              <h2 className="text-blue-600 mb-4 pb-2 border-b-2 border-blue-400">
                Top 8 Companies You Want to Join
              </h2>
              <div className="grid grid-cols-4 gap-4">
                {(isEditMode ? editedProfile.topCompanies : profile.topCompanies).map((company, index) => (
                  <div key={index} className="text-center">
                    <div className="w-full aspect-square bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg mb-2 flex items-center justify-center p-3">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => updateCompany(index, e.target.value)}
                          className="w-full text-center text-blue-600 text-sm bg-transparent border border-blue-400 rounded px-1 py-1 focus:outline-none focus:border-blue-600"
                        />
                      ) : (
                        <span className="text-blue-600 text-sm">{company}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{company}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-400">
              <h2 className="text-blue-600 mb-4 pb-2 border-b-2 border-blue-400">
                {profile.name}'s Comments (Showing 2 of 2)
              </h2>
              
              {/* Add Comment */}
              <div className="mb-4">
                <textarea
                  rows={3}
                  placeholder="Leave a comment..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-400 transition-all resize-none"
                />
                <button className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-all">
                  Post Comment
                </button>
              </div>

              {/* Sample Comments */}
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="flex gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-pink-200 rounded flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-600">Sarah</span>
                        <span className="text-gray-400 text-sm">2 days ago</span>
                      </div>
                      <p className="text-gray-700">Great profile! Let's connect!</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <div className="flex gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-200 to-blue-200 rounded flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-600">Mike</span>
                        <span className="text-gray-400 text-sm">5 days ago</span>
                      </div>
                      <p className="text-gray-700">Hey! Love your taste in music 🎵</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}