module.exports = (req, res) => {
  res.writeHead(405)
  return res.end(JSON.stringify({ message: 'Invalid method used' }))
}
