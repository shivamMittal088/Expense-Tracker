import React, { useState, useEffect } from 'react';
import Api from '../routeWrapper/Api';
import { AxiosError } from 'axios';

interface ProfileData {
  name: string;
  emailId: string;
  photoURL?: string;
  statusMessage?: string;
  currency: "INR" | "USD" | "EUR";
  preferences: {
    darkMode: boolean;
    startWeekOnMonday: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await Api.get('/api/profile/view');
        setProfile(response.data);
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || 'Failed to fetch profile');
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (!profile) {
    return <div className="text-center">No profile data available</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6 mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Profile</h2>
      {profile.photoURL && (
        <img
          src={profile.photoURL}
          alt="Profile"
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
      )}
      <div className="space-y-2">
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.emailId}</p>
        <p><strong>Status Message:</strong> {profile.statusMessage || 'No status message'}</p>
        <p><strong>Currency:</strong> {profile.currency}</p>
        <p><strong>Dark Mode:</strong> {profile.preferences.darkMode ? 'Enabled' : 'Disabled'}</p>
        <p><strong>Start Week on Monday:</strong> {profile.preferences.startWeekOnMonday ? 'Yes' : 'No'}</p>
        <p><strong>Created At:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>
        <p><strong>Updated At:</strong> {new Date(profile.updatedAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default Profile;
