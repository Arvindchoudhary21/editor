import React, { useState, useRef, useEffect } from 'react'
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import ACTIONS from '../Actions';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useNavigate, Navigate, useParams } from 'react-router-dom';
function EditorPage() {

    const socketRef = useRef(null);
    const codeRef = useRef(null) //for syncing the code in real time
    const location = useLocation();
    const reactNavigator = useNavigate()
    const { roomId } = useParams(); // because in app.js we set path as /editor/:roomId

    const [clients, setClients] = useState([]);

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();

            // for handling errors 
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed , try again later.');
                reactNavigator('/');
            }

            // for sending the room id and listen this on server.js
            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });


            // Listening for joined event when someone joins the room
            socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                if (username !== location.state?.username) {
                    // dont notify when myself joins the room ok
                    toast.success(`${username} joined the room.`)
                    // console.log(`${username} joined`);
                }
                setClients(clients);
                // logic for when user joins room then he can see the previous code written before joining
                socketRef.current.emit(ACTIONS.SYNC_CODE, {
                    code: codeRef.current,
                    socketId,
                    //sending the code and socketId to the server.js the server will pass the code to the joined user 
                })
            })

            //Listening for disconnected
            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                toast.success(`${username} left the room.`)
                // remove the entry from clients array 
                setClients((prev) => {
                    return prev.filter((client) => client.socketId !== socketId);
                })
            })

        };
        init();

        // clearing the listeners to avoid memory leak
        return () => {
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
            socketRef.current.disconnect();
        }

    }, [])


    // function to copy the room id
    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clip board');
        } catch (err) {
            toast.error('Could not copy the room ID');
            console.log(err);
        }
    }


    // function to leave the room 
    function leaveRoom() {
        reactNavigator('/');
    }



    // if username or roomid not found then navigate to home page using Navigate hook
    if (!location.state) {
        <Navigate to="/" />
    }


    return (
        <div className='mainWrap'>
            <div className='aside'>
                <div className='asideInner'>
                    <div className='logo'>
                        <img
                            className='logoImage'
                            src='/code-sync.png'
                            alt='logo'></img>
                    </div>
                    <h3>Connected</h3>
                    <div className='clientsList'>
                        {
                            clients.map((client) => (
                                <Client
                                    key={client.socketId}
                                    username={client.username}
                                />
                            ))
                        }
                    </div>
                </div>
                <button className='btn copyBtn' onClick={copyRoomId}>Copy ROOM ID</button>
                <button className='btn leaveBtn' onClick={leaveRoom}>Leave</button>
            </div>
            <div className='editorWrap'>
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => { codeRef.current = code; }} //execute when called in editor.js
                />
            </div>
        </div>
    )
}

export default EditorPage
