import { useEffect, useState } from 'react';
import { useUserData } from '../../hooks/useUserData';
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../lib/firebase';
import './userProfile.scss';
import Back from '../Back/Back';

const avatar = '/avatar.jpg';

export default function UserProfile() {
  const userId = localStorage.getItem('userId') ?? '';
  const { data, isLoading, isError } = useUserData(userId);

  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFullName(data.fullName || '');
    }
  }, [data]);

  const handleSave = async () => {
    if (!auth.currentUser || !userId) return;

    setSaving(true);

    try {
      const updates: any = {};

      if (fullName && fullName !== data!.fullName) {
        updates.fullName = fullName;
        await updateProfile(auth.currentUser, { displayName: fullName });
      }

      if (currentPassword && newPassword) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
      }

      if (avatarFile) {
        const avatarRef = ref(storage, `avatars/${userId}`);
        await uploadBytes(avatarRef, avatarFile);
        const avatarUrl = await getDownloadURL(avatarRef);
        updates.avatarUrl = avatarUrl;
      }

      if (Object.keys(updates).length > 0) {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, updates);
      }

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="edit-profile-page">Loading...</div>;
  if (isError || !data) return <div className="edit-profile-page">Error loading user</div>;
  
  return (
    <div className="edit-profile-page">
      <Back />
      <div className="profile-section">
        <div className="avatar-wrapper">
          <div className="avatar-preview">
            {avatar ? (
              <img src={avatar} alt="Avatar" />
            ) : (
              <div className="placeholder">{data.fullName?.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <label className="upload-photo">
            Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={e => setAvatarFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="form-fields">
          <h2>Email: {data.email}</h2>
          <label>
            Full Name
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
          </label>

          <label>
            Current Password
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
          </label>

          <label>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </label>

          <button className="save-button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
