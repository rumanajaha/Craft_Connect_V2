export function authorize(roles = []) {
  return (user) => {
    if (!user) return false
    return roles.includes(user.role)
  }
}
