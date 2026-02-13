package notification

import (
	"log"
	"sync"
	"time"

	pb "sonic-trivia/backend/protos"
)

var (
	globalManager     *Manager
	globalManagerOnce sync.Once
)

// Manager manages all active streaming connections for approval queue updates
type Manager struct {
	mu      sync.RWMutex
	clients map[string]chan *pb.ApprovalQueueUpdate
}

// GetGlobalManager returns the singleton instance of the notification manager
func GetGlobalManager() *Manager {
	globalManagerOnce.Do(func() {
		globalManager = &Manager{
			clients: make(map[string]chan *pb.ApprovalQueueUpdate),
		}
		log.Println("Global notification manager initialized")
	})
	return globalManager
}

// Register adds a new client to receive broadcasts
func (m *Manager) Register(clientID string) chan *pb.ApprovalQueueUpdate {
	m.mu.Lock()
	defer m.mu.Unlock()

	ch := make(chan *pb.ApprovalQueueUpdate, 100)
	m.clients[clientID] = ch
	log.Printf("Client %s registered for approval queue updates (total clients: %d)", clientID, len(m.clients))
	return ch
}

// Unregister removes a client from broadcasts
func (m *Manager) Unregister(clientID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if ch, ok := m.clients[clientID]; ok {
		close(ch)
		delete(m.clients, clientID)
		log.Printf("Client %s unregistered from approval queue updates (remaining clients: %d)", clientID, len(m.clients))
	}
}

// Broadcast sends an update to all connected clients
func (m *Manager) Broadcast(update *pb.ApprovalQueueUpdate) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if len(m.clients) == 0 {
		log.Printf("No clients connected, skipping broadcast for action: %s", update.Action)
		return
	}

	log.Printf("Broadcasting approval queue update (action: %s) to %d clients", update.Action, len(m.clients))
	for clientID, ch := range m.clients {
		select {
		case ch <- update:
			// Successfully sent
			log.Printf("Update sent to client %s", clientID)
		default:
			log.Printf("Warning: Client %s channel full, skipping update", clientID)
		}
	}
}

// NotifyQuestionAdded notifies all clients that a question was added to the approval queue
func (m *Manager) NotifyQuestionAdded(userID, questionID string) {
	update := &pb.ApprovalQueueUpdate{
		Action: "added",
		ApprovalRequest: &pb.ApprovalRequest{
			UserId:     userID,
			QuestionId: &questionID,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	m.Broadcast(update)
}

// NotifyQuestionCollectionAdded notifies all clients that a question collection was added to the approval queue
func (m *Manager) NotifyQuestionCollectionAdded(userID, collectionID string) {
	update := &pb.ApprovalQueueUpdate{
		Action: "added",
		ApprovalRequest: &pb.ApprovalRequest{
			UserId:               userID,
			QuestionCollectionId: &collectionID,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	m.Broadcast(update)
}

// NotifySongAdded notifies all clients that a song was added to the approval queue
func (m *Manager) NotifySongAdded(userID, songID string) {
	update := &pb.ApprovalQueueUpdate{
		Action: "added",
		ApprovalRequest: &pb.ApprovalRequest{
			UserId: userID,
			SongId: &songID,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	m.Broadcast(update)
}

// NotifySongCollectionAdded notifies all clients that a song collection was added to the approval queue
func (m *Manager) NotifySongCollectionAdded(userID, collectionID string) {
	update := &pb.ApprovalQueueUpdate{
		Action: "added",
		ApprovalRequest: &pb.ApprovalRequest{
			UserId:           userID,
			SongCollectionId: &collectionID,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	m.Broadcast(update)
}

// NotifyApproved notifies all clients that content was approved
func (m *Manager) NotifyApproved(userID string, questionID, questionCollectionID, songID, songCollectionID *string) {
	update := &pb.ApprovalQueueUpdate{
		Action: "approved",
		ApprovalRequest: &pb.ApprovalRequest{
			UserId:               userID,
			QuestionId:           questionID,
			QuestionCollectionId: questionCollectionID,
			SongId:               songID,
			SongCollectionId:     songCollectionID,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	m.Broadcast(update)
}

// NotifyRemoved notifies all clients that an item was removed from the approval queue
func (m *Manager) NotifyRemoved(userID string, questionID, questionCollectionID, songID, songCollectionID *string) {
	update := &pb.ApprovalQueueUpdate{
		Action: "removed",
		ApprovalRequest: &pb.ApprovalRequest{
			UserId:               userID,
			QuestionId:           questionID,
			QuestionCollectionId: questionCollectionID,
			SongId:               songID,
			SongCollectionId:     songCollectionID,
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}
	m.Broadcast(update)
}

// GetClientCount returns the number of currently connected clients
func (m *Manager) GetClientCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.clients)
}
