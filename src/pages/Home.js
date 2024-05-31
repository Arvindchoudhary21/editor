import React, { useState } from 'react'
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
function Home() {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        // console.log(id);
        // green color tick is for success message
        // add container in app.js to use it
        toast.success('A new room created.')
    };

    const joinRoom = () => {
        if (!roomId || !username) {
            toast.error('Room ID and Username is required');
            return;
        }

        //Redirect to editors page
        navigate(`/editor/${roomId}`, {
            state: {
                username, //passing the username to the editor's page
            }
        })
    }

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            // console.log(e.code);
            joinRoom();
        }
    }

    return (
        <div className='homePageWrapper'>
            <div className='formWrapper'>
                <img className='homePageLogo' src='/code-sync.png' alt='code-sync-logo'></img>
                <h4 className='mainLabel'>Paste Invitation ROOM ID</h4>
                <div className='inputGroup'>
                    <input
                        type='text'
                        className='inputBox'
                        placeholder='ROOM ID'
                        onChange={(e) => setRoomId(e.target.value)}
                        value={roomId}
                        onKeyUp={handleInputEnter}
                    />
                    <input
                        type='text'
                        className='inputBox'
                        placeholder='USERNAME'
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        onKeyUp={handleInputEnter}
                    />
                    <button className='btn joinBtn' onClick={joinRoom}>Join</button>
                    <span className='createInfo'>
                        If you don't have an invite then create &nbsp;
                        <a onClick={createNewRoom} href='' className='createNewBtn'>new room</a>
                    </span>
                </div>
            </div>
            <footer>
                {/* <h4>Built by IT</h4> */}
            </footer>
        </div>
    )
}

export default Home
