// Application State
const state = {
    currentState: 'q0',
    visitedStates: [],
    mode: 'DFA',
    tokenIndex: 0,
    isRunning: false,
    speed: 1000,
    stack: ['Start'],
    bookingData: {
        from: '',
        to: '',
        train: null,
        seat: null,
        held: false,
        paid: false,
        ticketIssued: false,
        ticketId: ''
    }
};

// Data
const trains = [
    { name: 'Rajdhani Express', code: '12301' },
    { name: 'Shatabdi Express', code: '12002' },
    { name: 'Vande Bharat', code: '22435' },
    { name: 'Duronto Express', code: '12213' },
    { name: 'Intercity Express', code: '12345' }
];

const seats = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18'];

const states = [
    { id: 'q0', label: 'Start' },
    { id: 'q1', label: 'Select Journey' },
    { id: 'q2', label: 'Choose Train' },
    { id: 'q3', label: 'Choose Seat' },
    { id: 'q4', label: 'Hold Seat' },
    { id: 'q5', label: 'Payment' },
    { id: 'q6', label: 'Issue Ticket' },
    { id: 'q7', label: 'End Session' },
    { id: 'q8', label: 'Error' }
];

// State Transitions
const transitions = {
    'q0': { 'S': 'q1' },
    'q1': { 'T': 'q2' },
    'q2': { 'C': 'q3' },
    'q3': { 'H': 'q4', 'R': 'q3' },
    'q4': { 'P+': 'q5', 'P-': 'q4', 'R': 'q3' },
    'q5': { 'I': 'q6', 'R': 'q3' },
    'q6': { 'E': 'q7', 'R': 'q3' },
    'q7': {},
    'q8': { 'R': 'q3' }
};

// Initialize
function init() {
    renderStateDiagram();
    renderTrains();
    renderSeats();
    updateUI();
    
    // Mode toggle
    document.getElementById('dfaMode').addEventListener('click', () => switchMode('DFA'));
    document.getElementById('pdaMode').addEventListener('click', () => switchMode('PDA'));
    
    // Speed slider
    document.getElementById('speedSlider').addEventListener('input', (e) => {
        state.speed = parseInt(e.target.value);
        document.getElementById('speedValue').textContent = (state.speed / 1000).toFixed(1) + 's';
    });
}

function renderStateDiagram() {
    const container = document.getElementById('statesDiagram');
    container.innerHTML = '';
    
    states.forEach((st, index) => {
        // State
        const stateDiv = document.createElement('div');
        stateDiv.className = 'state';
        
        const circle = document.createElement('div');
        circle.className = 'state-circle';
        circle.id = `state-${st.id}`;
        circle.textContent = st.id;
        
        const label = document.createElement('div');
        label.className = 'state-label';
        label.textContent = st.label;
        
        stateDiv.appendChild(circle);
        stateDiv.appendChild(label);
        container.appendChild(stateDiv);
        
        // Arrow (except after last state)
        if (index < states.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'state-arrow';
            arrow.textContent = '→';
            container.appendChild(arrow);
        }
    });
    
    updateStateVisuals();
}

function renderTrains() {
    const container = document.getElementById('trainGrid');
    container.innerHTML = '';
    
    trains.forEach(train => {
        const btn = document.createElement('button');
        btn.className = 'train-btn';
        btn.innerHTML = `
            <div class="train-name">${train.name}</div>
            <div class="train-code">Code: ${train.code}</div>
        `;
        btn.onclick = () => selectTrain(train);
        container.appendChild(btn);
    });
}

function renderSeats() {
    const container = document.getElementById('seatGrid');
    container.innerHTML = '';
    
    seats.forEach(seat => {
        const btn = document.createElement('button');
        btn.className = 'seat-btn';
        btn.textContent = seat;
        btn.onclick = () => selectSeat(seat);
        container.appendChild(btn);
    });
}

function switchMode(mode) {
    state.mode = mode;
    document.getElementById('dfaMode').classList.toggle('active', mode === 'DFA');
    document.getElementById('pdaMode').classList.toggle('active', mode === 'PDA');
    document.getElementById('stackVisualization').style.display = mode === 'PDA' ? 'block' : 'none';
    addLog(`Switched to ${mode} mode`);
}

function updateStateVisuals() {
    states.forEach(st => {
        const circle = document.getElementById(`state-${st.id}`);
        if (circle) {
            circle.className = 'state-circle';
            if (st.id === state.currentState) {
                circle.classList.add('current');
            } else if (state.visitedStates.includes(st.id)) {
                circle.classList.add('visited');
            }
            if (st.id === 'q8' && state.currentState === 'q8') {
                circle.classList.add('error');
            }
        }
    });
}

function updateUI() {
    updateStateVisuals();
    updateStepIndicator();
    updateSectionHighlights();
    if (state.mode === 'PDA') {
        updateStackVisualization();
    }
}

function updateStepIndicator() {
    const indicator = document.getElementById('stepIndicator');
    const stepMap = {
        'q0': { step: 0, text: 'Ready to Start' },
        'q1': { step: 1, text: 'Journey Selection' },
        'q2': { step: 2, text: 'Train Selection' },
        'q3': { step: 3, text: 'Seat Selection' },
        'q4': { step: 4, text: 'Seat Held' },
        'q5': { step: 5, text: 'Payment Completed' },
        'q6': { step: 6, text: 'Ticket Issued' },
        'q7': { step: 7, text: 'Session Ended' },
        'q8': { step: 0, text: 'Error State' }
    };
    const current = stepMap[state.currentState] || { step: 0, text: 'Unknown' };
    indicator.textContent = `Step ${current.step}/7 - ${current.text}`;
}

function updateSectionHighlights() {
    const sectionMap = {
        'q0': null,
        'q1': 'section-journey',
        'q2': 'section-train',
        'q3': 'section-seat',
        'q4': 'section-payment',
        'q5': 'section-payment',
        'q6': 'section-ticket',
        'q7': 'section-ticket',
        'q8': null
    };
    
    ['section-journey', 'section-train', 'section-seat', 'section-payment', 'section-actions', 'section-ticket'].forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.classList.remove('active');
        }
    });
    
    const activeSection = sectionMap[state.currentState];
    if (activeSection) {
        const section = document.getElementById(activeSection);
        if (section) {
            section.classList.add('active');
        }
    }
}

function updateStackVisualization() {
    const container = document.getElementById('stackItems');
    container.innerHTML = '';
    
    state.stack.slice(-5).forEach(item => {
        const div = document.createElement('div');
        div.className = 'stack-item';
        div.textContent = item;
        container.appendChild(div);
    });
}

function addLog(message, type = 'normal') {
    const log = document.getElementById('executionLog');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

function addToken(token) {
    const input = document.getElementById('tokenInput');
    input.value = input.value.trim() + ' ' + token;
    input.value = input.value.trim();
}

function undoToken() {
    const input = document.getElementById('tokenInput');
    const tokens = input.value.trim().split(/\s+/);
    tokens.pop();
    input.value = tokens.join(' ');
}

function clearTokens() {
    document.getElementById('tokenInput').value = '';
}

function getTokens() {
    const input = document.getElementById('tokenInput').value.trim();
    return input.split(/\s+/).filter(t => t.length > 0);
}

function stepToken() {
    if (state.isRunning) return;
    
    const tokens = getTokens();
    if (state.tokenIndex >= tokens.length) {
        addLog('No more tokens to process', 'error');
        return;
    }
    
    const token = tokens[state.tokenIndex];
    processToken(token);
    state.tokenIndex++;
}

async function runAll() {
    if (state.isRunning) return;
    
    state.isRunning = true;
    const tokens = getTokens();
    
    while (state.tokenIndex < tokens.length && state.isRunning) {
        const token = tokens[state.tokenIndex];
        processToken(token);
        state.tokenIndex++;
        await sleep(state.speed);
    }
    
    state.isRunning = false;
    if (state.tokenIndex >= tokens.length) {
        addLog('All tokens processed', 'success');
    }
}

function processToken(token) {
    const prevState = state.currentState;
    
    // Check if transition exists
    if (!transitions[prevState] || !transitions[prevState][token]) {
        addLog(`Invalid transition from ${prevState} with token ${token}`, 'error');
        state.currentState = 'q8';
        updateUI();
        return;
    }
    
    const nextState = transitions[prevState][token];
    state.currentState = nextState;
    state.visitedStates.push(nextState);
    
    // Process based on token
    processTokenAction(token);
    
    // Update stack for PDA
    if (state.mode === 'PDA') {
        updateStackForToken(token);
    }
    
    addLog(`Processed token ${token}: ${prevState} → ${nextState}`, 'success');
    updateUI();
}

function processTokenAction(token) {
    switch(token) {
        case 'S':
            const from = document.getElementById('fromInput').value || 'Mumbai';
            const to = document.getElementById('toInput').value || 'Delhi';
            state.bookingData.from = from;
            state.bookingData.to = to;
            document.getElementById('journeyDisplay').textContent = `Selected: ${from} → ${to}`;
            break;
            
        case 'T':
            // Auto-select first train for demo
            if (!state.bookingData.train) {
                state.bookingData.train = trains[0];
                document.getElementById('trainDisplay').textContent = `Selected train: ${trains[0].name} (${trains[0].code})`;
                highlightTrain(trains[0]);
            }
            break;
            
        case 'C':
            // Auto-select first available seat for demo
            if (!state.bookingData.seat) {
                state.bookingData.seat = seats[0];
                document.getElementById('seatDisplay').textContent = `Selected seat: ${seats[0]}`;
                highlightSeat(seats[0]);
            }
            break;
            
        case 'H':
            state.bookingData.held = true;
            document.getElementById('holdDisplay').textContent = `Held seats: ${state.bookingData.seat || 'None'}`;
            break;
            
        case 'P+':
            state.bookingData.paid = true;
            document.getElementById('holdDisplay').textContent = `Payment successful for seat: ${state.bookingData.seat}`;
            break;
            
        case 'P-':
            state.bookingData.paid = false;
            document.getElementById('holdDisplay').textContent = `Payment failed. Retry payment.`;
            break;
            
        case 'I':
            state.bookingData.ticketIssued = true;
            state.bookingData.ticketId = 'TXN' + Math.floor(Math.random() * 90000 + 10000);
            displayTicket();
            break;
            
        case 'R':
            // Rollback - release seat
            state.bookingData.held = false;
            state.bookingData.paid = false;
            document.getElementById('holdDisplay').textContent = `Seat released. Select again.`;
            break;
            
        case 'E':
            addLog('Session ended successfully', 'success');
            break;
    }
}

function updateStackForToken(token) {
    const stackActions = {
        'S': 'Journey',
        'T': `Train: ${state.bookingData.train?.name || 'TBD'}`,
        'C': `Seat: ${state.bookingData.seat || 'TBD'}`,
        'H': 'Hold',
        'P+': 'Payment',
        'I': 'Ticket',
        'E': 'End',
        'R': 'Rollback'
    };
    
    if (token === 'R') {
        // Pop multiple items on rollback
        while (state.stack.length > 1 && state.stack[state.stack.length - 1] !== 'Journey') {
            state.stack.pop();
        }
    } else if (stackActions[token]) {
        state.stack.push(stackActions[token]);
    }
}

function selectTrain(train) {
    state.bookingData.train = train;
    document.getElementById('trainDisplay').textContent = `Selected train: ${train.name} (${train.code})`;
    highlightTrain(train);
    addLog(`Train selected: ${train.name}`);
}

function highlightTrain(train) {
    document.querySelectorAll('.train-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent.includes(train.name)) {
            btn.classList.add('selected');
        }
    });
}

function selectSeat(seat) {
    state.bookingData.seat = seat;
    document.getElementById('seatDisplay').textContent = `Selected seat: ${seat}`;
    highlightSeat(seat);
    addLog(`Seat selected: ${seat}`);
}

function highlightSeat(seat) {
    document.querySelectorAll('.seat-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === seat) {
            btn.classList.add('selected');
        }
    });
}

function displayTicket() {
    const container = document.getElementById('ticketContainer');
    container.innerHTML = `
        <div class="ticket-display">
            <div class="ticket-header">🎫 Railway Ticket</div>
            <div class="ticket-body">
                <div class="ticket-row">
                    <span class="ticket-label">Ticket ID:</span>
                    <span class="ticket-value">${state.bookingData.ticketId}</span>
                </div>
                <div class="ticket-row">
                    <span class="ticket-label">Train:</span>
                    <span class="ticket-value">${state.bookingData.train?.name || 'N/A'}</span>
                </div>
                <div class="ticket-row">
                    <span class="ticket-label">Train Code:</span>
                    <span class="ticket-value">${state.bookingData.train?.code || 'N/A'}</span>
                </div>
                <div class="ticket-row">
                    <span class="ticket-label">Seat:</span>
                    <span class="ticket-value">${state.bookingData.seat || 'N/A'}</span>
                </div>
                <div class="ticket-row">
                    <span class="ticket-label">From:</span>
                    <span class="ticket-value">${state.bookingData.from}</span>
                </div>
                <div class="ticket-row">
                    <span class="ticket-label">To:</span>
                    <span class="ticket-value">${state.bookingData.to}</span>
                </div>
            </div>
        </div>
    `;
}

function simulateAction(action) {
    addLog(`Direct action triggered: ${action}`, 'normal');
    // Note: Actions are processed via tokens, not direct clicks in this simulator
}

function reset() {
    state.currentState = 'q0';
    state.visitedStates = [];
    state.tokenIndex = 0;
    state.isRunning = false;
    state.stack = ['Start'];
    state.bookingData = {
        from: '',
        to: '',
        train: null,
        seat: null,
        held: false,
        paid: false,
        ticketIssued: false,
        ticketId: ''
    };
    
    document.getElementById('journeyDisplay').textContent = 'Selected: --';
    document.getElementById('trainDisplay').textContent = 'Selected train: --';
    document.getElementById('seatDisplay').textContent = 'Selected seat: --';
    document.getElementById('holdDisplay').textContent = 'Held seats: --';
    document.getElementById('ticketContainer').innerHTML = '<div class="no-ticket">No ticket yet. Complete the booking process to generate a ticket.</div>';
    
    document.querySelectorAll('.train-btn, .seat-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    document.getElementById('executionLog').innerHTML = '<div class="log-entry">System reset. Ready to process tokens.</div>';
    
    updateUI();
    addLog('System reset complete', 'success');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize on load
init();