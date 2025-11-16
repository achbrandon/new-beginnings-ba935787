
-- Enable realtime for alerts table so notifications update in real-time
ALTER TABLE alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
