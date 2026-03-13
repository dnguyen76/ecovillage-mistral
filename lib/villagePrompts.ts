// ── Ancre visuelle commune — IDENTIQUE dans les 2 images ──────────────────

export const ANCHOR = `
STRICT VISUAL CONSISTENCY — same viewpoint, same layout, same buildings in BOTH images:
- Viewpoint: aerial isometric, 45-degree angle, camera facing north-east, fixed altitude
- Zoom: entire village in frame, no cropping
- Style: flat isometric digital illustration, clean sharp outlines, professional urban planning map art
- Lighting: midday sun
- Format: wide landscape 1024x768

FIXED ZONES — mandatory layout, no gaps between zones:

  [NORTH STRIP — full width, top 25%]:
    - 4 rectangular crop fields filling the full width edge to edge
    - Orchard tree row running full width just below the fields
    - L-shaped farm building top-right corner

  [WEST STRIP — full height, left 30%]:
    - Factory building upper-left quadrant (same large rectangle both images)
    - Truck parking mid-left
    - Material depot lower-mid-left
    - Waste disposal zone bottom-left corner

  [CENTER BLOCK — middle 40% width, middle 50% height]:
    - Town hall large rectangle centered
    - Cobblestone village square in front of town hall
    - 3 shop fronts left of square
    - 6 residential houses (3 each side of main street)
    - Roads and sidewalks filling all space between buildings

  [EAST STRIP — full height, right 30%]:
    - Dense forest block filling entire right strip top to bottom
    - Small park embedded inside forest
    - Hiking trail cutting through forest

  [SOUTH STRIP — full width, bottom 20%]:
    - River filling entire bottom band edge to edge
    - Stone bridge at center of river
    - Water treatment plant bottom-left of this strip
`

// ── Prompt AVANT — village avec tous ses problèmes environnementaux ────────

export const BEFORE_PROMPT = `Isometric aerial illustration of a polluted French village. Dystopian, oppressive mood.

${ANCHOR}

ATMOSPHERE:
- Sky: dark charcoal storm clouds, no blue sky, oppressive toxic darkness
- Thick black smoke plumes rising from all 3 factory chimneys, drifting east across the village
- Brown-yellow smog haze blanketing the entire west half of the image
- Color palette: soot black, dark charcoal, toxic orange-brown, dead yellow, dirty grey

NORTH — FIELDS AND FARM:
- Fields: yellowed dead crops, cracked dry bare soil, plastic waste caught on fences
- Orchard: sparse dry trees with little fruit
- Farm building: weathered, neglected

WEST — INDUSTRIAL ZONE:
- Factory: 3 chimneys emitting THICK BLACK smoke plumes merging with the dark sky
- Dark soot stains on factory walls and nearby rooftops
- Truck parking: 8 large diesel trucks, dark exhaust fumes visible
- Material depot: disorganized piles, no sorting
- Waste disposal zone: containers OVERFLOWING, black garbage bags spilling onto the ground

CENTER — VILLAGE:
- Village square: cars parked everywhere, litter on the ground
- Main street: bumper-to-bumper traffic jam, cars parked on sidewalks
- Shop fronts: garbage bags piled in front, plastic litter on the ground
- 6 houses: overflowing bins in each garden, garbage bags in the street
- No recycling sorting visible anywhere

EAST — FOREST:
- Forest: large brown bare-earth patches (30% of area), tree stumps visible
- Dead and dying trees at forest edge
- Illegal dumping pile visible at forest edge

SOUTH — RIVER:
- River: near-black oily water, thick white chemical foam on surface
- Visible pollution discharge pipe entering the river
- Water treatment plant: grey and unused-looking
`

// ── Prompt APRÈS — même village, mêmes bâtiments, transformé par les actions

export function buildAfterPrompt(choices: {
  agriculteurs: string[]
  industriels: string[]
  habitants: string[]
  elus: string[]
}): string {
  const agri  = choices.agriculteurs.join(' + ') || 'agriculture durable'
  const indus = choices.industriels.join(' + ')   || 'énergie propre'
  const hab   = choices.habitants.join(' + ')     || 'espaces verts'
  const elus  = choices.elus.join(' + ')          || 'pistes cyclables'

  return `Isometric aerial illustration of the EXACT SAME French village, AFTER ecological transformation. Hopeful, vibrant mood.

${ANCHOR}

CRITICAL — SAME BUILDINGS, SAME POSITIONS:
- Every building, road, and structure is in the EXACT same position as the before image
- Same factory (same rectangle, same 3 chimneys), same houses, same town hall, same forest block, same river
- ONLY colors, surface details, and small visible additions change — nothing is moved or removed
- Placed side by side, the two images must align perfectly

ATMOSPHERE:
- Sky: bright blue, clear, no smoke, no haze, sun visible
- Warm golden light over the whole village
- Color palette: bright green, sky blue, warm yellow, clean white — hopeful and vibrant

NORTH — FIELDS AND FARM (actions: ${agri}):
- Fields: lush green organic crops, hedgerow lines between fields
- Solar panels on farm roof
- Small market stall at field entrance with fresh produce
- Orchard: full healthy trees with fruit visible

WEST — INDUSTRIAL ZONE (actions: ${indus}):
- Factory: SAME building, SAME 3 chimneys — chimneys emit NO smoke, repainted light grey
- Factory roof: covered with blue solar panel grid
- Truck parking: SAME area — electric white/blue trucks, no exhaust
- Material depot: SAME area — organized color-coded recycling zones, clean
- Waste disposal zone: SAME corner — tidy sorted containers, green bushes planted around, no litter

CENTER — VILLAGE (actions: ${hab} / ${elus}):
- Main street: SAME road — green painted cycle lane, fewer cars, cyclists and pedestrians visible
- Village square: SAME cobblestones — market canopies, people walking, flower beds, no car traffic
- Shop fronts: SAME 3 buildings — bike racks, clean pavement, window boxes with flowers
- 6 houses: SAME positions — clean gardens, sorted bins (green/yellow/blue), solar panels on roofs
- One parking lot converted to community vegetable garden with raised beds

EAST — FOREST (actions: ${agri}):
- Forest: SAME block — brown bare patches replaced by light green young saplings
- Forest edge: healthy trees, full green canopy
- Former illegal dump: cleaned up, small planted green area

SOUTH — RIVER (actions: ${elus} / ${hab}):
- River: SAME band — clear blue-green water, green reeds on banks, no foam
- Water treatment plant: active and clean, solar panels on roof
- Stone bridge: SAME bridge — clean stonework, flower planters on railings

This is the same village, same layout, same buildings — problems solved, environment healed.`
}
