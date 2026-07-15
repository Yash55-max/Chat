import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, getDocs, query, orderBy, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');
const modeChips = document.querySelectorAll('.mode-chip');

let currentUser = null;
let conversationHistory = [];
let currentMode = 'general';
let activeChatId = null;
let currentImageFile = null;

const historyList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat-btn');
const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
const sidebar = document.querySelector('.sidebar');
const imageUpload = document.getElementById('image-upload');
const imageStaging = document.getElementById('image-staging');
const stagedImage = document.getElementById('staged-image');
const removeImageBtn = document.getElementById('remove-image-btn');

if (imageUpload) {
    imageUpload.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            currentImageFile = e.target.files[0];
            stagedImage.src = URL.createObjectURL(currentImageFile);
            imageStaging.classList.remove('hidden');
        }
    });
}

if (removeImageBtn) {
    removeImageBtn.addEventListener('click', () => {
        currentImageFile = null;
        imageUpload.value = '';
        imageStaging.classList.add('hidden');
    });
}

if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}

if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        activeChatId = null;
        conversationHistory = [];
        chatMessages.innerHTML = '';
        document.querySelector('.chat-container').classList.remove('chat-active');
        document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
    });
}

modeChips.forEach(chip => {
    chip.addEventListener('click', () => {
        // Toggle active class
        modeChips.forEach(c => c.classList.remove('active'));

        if (currentMode === chip.dataset.mode) {
            // Deselect if already active
            currentMode = 'general';
        } else {
            // Select new mode
            chip.classList.add('active');
            currentMode = chip.dataset.mode;
        }
    });
});

// Dynamic Greeting Text
const greetings = [
    "How can I help you today?",
    "What shall we build next?",
    "Need help brainstorming ideas?",
    "Ready to write some code?",
    "What's on your mind today?",
    "How can I assist you right now?",
    "Let's explore something new!",
    "Have a question? Ask away.",
    "Looking for some creative inspiration?",
    "I'm here to help you get things done."
];

const greetingText = document.getElementById('greeting-text');
if (greetingText) {
    let greetingIndex = 0;
    setInterval(() => {
        greetingText.style.opacity = '0';
        setTimeout(() => {
            greetingIndex = (greetingIndex + 1) % greetings.length;
            greetingText.textContent = greetings[greetingIndex];
            greetingText.style.opacity = '1';
        }, 500); // Wait for fade out
    }, 4000); // Change every 4 seconds
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = '/login.html';
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        
        // Setup Profile
        const profileEmail = document.getElementById('profile-email');
        if (profileEmail) {
            profileEmail.textContent = user.email;
        }

        await loadChatsList();
    } else {
        window.location.href = '/login.html';
    }
});

// Profile Modal Logic
const profileBtn = document.getElementById('profile-btn');
const profileModalOverlay = document.getElementById('profile-modal-overlay');
const closeProfileBtn = document.getElementById('close-profile-btn');

if (profileBtn && profileModalOverlay && closeProfileBtn) {
    profileBtn.addEventListener('click', () => {
        profileModalOverlay.classList.remove('hidden');
    });

    closeProfileBtn.addEventListener('click', () => {
        profileModalOverlay.classList.add('hidden');
    });

    profileModalOverlay.addEventListener('click', (e) => {
        if (e.target === profileModalOverlay) {
            profileModalOverlay.classList.add('hidden');
        }
    });
}

function createMessageElement(content, isUser, imageUrl = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'message-image';
        contentDiv.appendChild(img);
    }

    if (content) {
        if (isUser) {
            const textNode = document.createTextNode(content);
            contentDiv.appendChild(textNode);
        } else {
            const parsedDiv = document.createElement('div');
            parsedDiv.innerHTML = marked.parse(content);
            contentDiv.appendChild(parsedDiv);
        }
    }

    msgDiv.appendChild(contentDiv);

    if (!isUser && content) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
        `;
        
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(content);
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Copied!
                `;
                setTimeout(() => {
                    copyBtn.innerHTML = originalHtml;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
        
        msgDiv.appendChild(actionsDiv);
        actionsDiv.appendChild(copyBtn);
    }

    return msgDiv;
}

function showTypingIndicator() {
    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'message bot-message typing-indicator-container';
    indicatorDiv.id = 'typing-indicator';

    const content = document.createElement('div');
    content.className = 'content typing-indicator';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        content.appendChild(dot);
    }

    indicatorDiv.appendChild(content);

    chatMessages.appendChild(indicatorDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

async function saveMessageToFirestore(role, content, imageUrl = null) {
    if (!currentUser) return;
    try {
        if (!activeChatId) {
            // Create a new chat session
            activeChatId = "chat_" + Date.now();

            // Set chat metadata
            await setDoc(doc(db, 'users', currentUser.uid, 'chats', activeChatId), {
                title: (content || "Image Upload").substring(0, 30) + (content && content.length > 30 ? '...' : ''),
                timestamp: new Date()
            });

            // Refresh sidebar
            loadChatsList();
        }

        const msgData = {
            role: role,
            content: content,
            timestamp: new Date()
        };
        
        if (imageUrl) {
            msgData.imageUrl = imageUrl;
        }

        await addDoc(collection(db, 'users', currentUser.uid, 'chats', activeChatId, 'messages'), msgData);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

async function loadChatsList() {
    if (!currentUser) return;
    try {
        const q = query(collection(db, 'users', currentUser.uid, 'chats'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);

        historyList.innerHTML = '';
        querySnapshot.forEach((d) => {
            const chat = d.data();
            const btn = document.createElement('button');
            btn.className = 'history-item';
            btn.textContent = chat.title || 'New Chat';
            btn.dataset.id = d.id;

            if (activeChatId === d.id) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => loadHistory(d.id));
            historyList.appendChild(btn);
        });
    } catch (err) {
        console.error("Failed to load chat list", err);
    }
}

async function loadHistory(chatId) {
    if (!currentUser) return;
    activeChatId = chatId;
    conversationHistory = [];
    chatMessages.innerHTML = '';

    document.querySelectorAll('.history-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === chatId);
    });

    try {
        const q = query(collection(db, 'users', currentUser.uid, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            document.querySelector('.chat-container').classList.add('chat-active');
            querySnapshot.forEach((d) => {
                const msg = d.data();
                const isUser = msg.role === 'user';
                chatMessages.appendChild(createMessageElement(msg.content, isUser, msg.imageUrl));
                conversationHistory.push({ role: msg.role, content: msg.content, imageUrl: msg.imageUrl });
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    } catch (err) {
        console.error("Failed to load history", err);
    }
}

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = messageInput.value.trim();
    if (!userMessage && !currentImageFile) return;

    document.querySelector('.chat-container').classList.add('chat-active');

    const sendBtn = chatForm.querySelector('#send-btn');
    messageInput.disabled = true;
    sendBtn.disabled = true;

    let uploadedImageUrl = null;
    if (currentImageFile) {
        try {
            const storageRef = ref(storage, `users/${currentUser.uid}/uploads/${Date.now()}_${currentImageFile.name}`);
            await uploadBytes(storageRef, currentImageFile);
            uploadedImageUrl = await getDownloadURL(storageRef);
            
            currentImageFile = null;
            imageUpload.value = '';
            imageStaging.classList.add('hidden');
        } catch (err) {
            console.error('Error uploading image', err);
            messageInput.disabled = false;
            sendBtn.disabled = false;
            return;
        }
    }

    messageInput.disabled = false;
    sendBtn.disabled = false;

    // Display user message
    chatMessages.appendChild(createMessageElement(userMessage, true, uploadedImageUrl));
    messageInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add to history and save to firestore
    conversationHistory.push({ role: 'user', content: userMessage, imageUrl: uploadedImageUrl });
    saveMessageToFirestore('user', userMessage, uploadedImageUrl);

    showTypingIndicator();

    try {
        const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000' 
            : 'YOUR_RENDER_URL'; // Replace this with your actual Render URL later
        
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: conversationHistory,
                mode: currentMode
            })
        });

        removeTypingIndicator();

        const data = await response.json();

        if (response.ok) {
            chatMessages.appendChild(createMessageElement(data.reply, false));
            conversationHistory.push({ role: 'assistant', content: data.reply });
            saveMessageToFirestore('assistant', data.reply);
        } else {
            const errorMsg = data.error || 'Something went wrong';
            chatMessages.appendChild(createMessageElement(`Error: ${errorMsg}`, false));
        }

    } catch (error) {
        removeTypingIndicator();
        chatMessages.appendChild(createMessageElement('Connection error. Please ensure the server is running.', false));
        console.error('Chat error:', error);
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
});
