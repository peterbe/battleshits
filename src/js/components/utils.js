/* wrapper on document.querySelector() that makes sure it yields
   exactly 1 element. */
let getOneElement = (selector) => {
  let nodes = document.querySelectorAll(selector)
  if (nodes.length > 1) {
    throw new Error(`Too many elements '${selector}'`)
  } else if (nodes.length < 1) {
    throw new Error(`Too few elements '${selector}'`)
  }
  return nodes[0]
}

export { getOneElement }
