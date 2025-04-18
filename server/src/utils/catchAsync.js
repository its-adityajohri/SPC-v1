module.exports = (fn) => {
    return (req, reply) => {
      fn(req, reply).catch((err) => reply.send(err));
    };
  };
  