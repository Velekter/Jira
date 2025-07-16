import FriendRequests from '../component/Friends/FriendRequests/FriendRequests';
import FriendSearch from '../component/Friends/FriendSearch/FriendSearch';
import FriendsList from '../component/Friends/FriendsList/FriendsList';
import Back from '../component/Back/Back';

function FriendPage() {
  return (
    <>
      <Back page={'/account'}/>
      <FriendSearch />
      <FriendRequests />
      <FriendsList />
    </>
  );
}

export default FriendPage;
