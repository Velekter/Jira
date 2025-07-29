import FriendRequests from '../component/Friends/FriendRequests/FriendRequests';
import FriendSearch from '../component/Friends/FriendSearch/FriendSearch';
import FriendsList from '../component/Friends/FriendsList/FriendsList';
import Back from '../component/Back/Back';
import './friendPage.scss';

function FriendPage() {
  return (
    <div className="friend-page">
      <Back page={'/account'} />
      <div className="friend-page__header">
        <h1>Friends & Connections</h1>
        <p>Manage your friends and discover new connections</p>
      </div>
      
      <div className="friend-page__content">
        <div className="friend-page__section">
          <FriendSearch />
        </div>
        
        <div className="friend-page__section">
          <FriendRequests />
        </div>
        
        <div className="friend-page__section">
          <FriendsList />
        </div>
      </div>
    </div>
  );
}

export default FriendPage;
