-- Add admin policies for support system

-- Allow admins to view all support tickets
CREATE POLICY "Admins can view all support tickets"
ON support_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to update all support tickets
CREATE POLICY "Admins can update all support tickets"
ON support_tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to view all support messages
CREATE POLICY "Admins can view all support messages"
ON support_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to insert messages as staff
CREATE POLICY "Admins can send support messages"
ON support_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
  AND is_staff = true
);

-- Allow admins to update support messages (mark as read, etc.)
CREATE POLICY "Admins can update support messages"
ON support_messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);