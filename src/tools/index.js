// Every quiz on the site lives in this list.
// To add a new quiz: write its config file, import it here, and add it to the array.
// Newest first, since the /tools page shows them in this order.
import storyOrSituation from './storyOrSituation.config'

export const tools = [storyOrSituation]

export const getTool = (id) => tools.find((tool) => tool.id === id)