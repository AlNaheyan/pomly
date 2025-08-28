const setupWebRTCHandlers = (io, socket) => {
    // webrtc signaling: send offer to specific user
    socket.on('webrtc-offer', (data) => {
      socket.to(data.targetUserId).emit('webrtc-offer', {
        offer: data.offer,
        fromUserId: socket.userId
      });
    });
    
    // webetc signaling: send answer to specific user
    socket.on('webrtc-answer', (data) => {
      socket.to(data.targetUserId).emit('webrtc-answer', {
        answer: data.answer,
        fromUserId: socket.userId
      });
    });
    
    // ice offfer
    socket.on('webrtc-ice-candidate', (data) => {
      socket.to(data.targetUserId).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        fromUserId: socket.userId
      });
    });
  };
  
  module.exports = { setupWebRTCHandlers };