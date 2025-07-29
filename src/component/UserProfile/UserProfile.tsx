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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (data) {
      setFullName(data.fullName || '');
    }
  }, [data]);

  const handleSave = async () => {
    if (!auth.currentUser || !userId) return;

    if (newPassword && newPassword !== confirmPassword) {
                 setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
             setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);

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

                   setMessage({ type: 'success', text: 'Profile updated successfully!' });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
                   setMessage({ type: 'error', text: 'Error updating profile. Please check your input data.' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="user-profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (isError || !data) {
    return (
      <div className="user-profile-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Loading Error</h3>
          <p>Failed to load user data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="user-profile-page">
      <Back page={'/account'}/>
      
      <div className="profile-container">
        <div className="profile-header">
          <h1>User Profile</h1>
          <p>Manage your personal data</p>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            <span className="message-icon">
              {message.type === 'success' ? '✅' : '❌'}
            </span>
            {message.text}
          </div>
        )}

        <div className="profile-content">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              <div className="avatar-preview">
                {avatar ? (
                  <img src={avatar} alt="Avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    {data.fullName?.charAt(0).toUpperCase()}
                  </div>
                )}
                {avatarFile && (
                  <div className="avatar-overlay">
                    <span>🔄</span>
                  </div>
                )}
              </div>
                             <label className="upload-button">
                 <span className="upload-text">Change Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label className="form-label">
                Email
              </label>
              <div className="email-display">{data.email}</div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Full Name
              </label>
              <input 
                type="text" 
                value={fullName} 
                onChange={e => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="form-input"
              />
            </div>

            <div className="password-section">
              <h3>Change Password</h3>
              
              <div className="form-group">
                <label className="form-label">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="form-input"
                />
              </div>
            </div>

            <button 
              className="save-button" 
              onClick={handleSave} 
              disabled={saving}
            >
                             {saving ? (
                 <>
                   <span className="spinner"></span>
                   Saving...
                 </>
               ) : (
                 'Save Changes'
               )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
