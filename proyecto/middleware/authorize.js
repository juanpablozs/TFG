function authorize(roles = []) {
    if (typeof roles === 'string') {
      roles = [roles];
    }
  
    return (req, res, next) => {
      const userRole = req.user.role;
  
      if (roles.length && !roles.includes(userRole)) {
        return res.status(403).json({ message: 'No tienes permisos para acceder a esta funcionalidad' });
      }
  
      next();
    };
  }
  
  module.exports = authorize;
  