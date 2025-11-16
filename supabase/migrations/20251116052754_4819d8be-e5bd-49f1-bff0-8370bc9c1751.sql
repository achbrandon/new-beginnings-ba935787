-- Allow users to create admin notifications (but only admins can view them)
DROP POLICY IF EXISTS "Admins view notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Users create admin notifications" ON admin_notifications;

-- Admins can view and manage all notifications
CREATE POLICY "Admins manage notifications"
ON admin_notifications
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can create admin notifications (for crypto transactions, etc.)
CREATE POLICY "Users create admin notifications"
ON admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);