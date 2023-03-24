// The floor gained at initial time is not added
const INITIAL_TIME = new Date("2023-02-21T05:00:00Z")
const INITIAL_FLOOR = {
  eos: 22 - 1,
  oceanus: 17 - 1,
  prometheus: 42 - 1,
  selene: 27 - 1,
  themis: 47 - 1,
}
const GROW_AT_HOURS = [1, 5, 10, 15, 20]

function getFloorAtTime(name, atTime) {
  const loopGrowth = GROW_AT_HOURS.length
  const loopTime = 24 * 60 * 60 * 1000

  // Gains 5 floor every 24 hours
  const diffDays = Math.floor((atTime.getTime() - INITIAL_TIME.getTime()) / loopTime)
  let time = new Date(INITIAL_TIME.getTime() + diffDays * loopTime)
  let gained = diffDays * loopGrowth
  // Gains 1 floor at specified time
  while (time <= atTime) {
    if (GROW_AT_HOURS.includes(time.getUTCHours())) {
      gained += 1
    }
    time.setHours(time.getHours() + 1)
  }
  const floor = (INITIAL_FLOOR[name] + gained - 15) % 35 + 15
  if (floor === 15 && atTime.getUTCHours() > 1) {
    return 50
  }
  return floor
}

function format(datetime, style) {
  switch (style) {
    case 'weekday': {
      return datetime.toLocaleString("bestfit", { weekday: 'short' })
    }
    case 'date': {
      return datetime.toLocaleString("bestfit", { month: 'numeric', day: 'numeric' })
    }
    case 'time': {
      return datetime.toLocaleString("bestfit", { hour: 'numeric', minute: 'numeric' })
    }
    default: {
      throw Error(`Unknown style '${style}'`)
    }
  }
}

document.addEventListener("DOMContentLoaded", (_) => {
  const tbody = document.querySelector('tbody')
  const template = document.createElement('template')

  // Start from current hour
  let stTime = new Date()
  stTime.setMinutes(0)
  stTime.setSeconds(0)
  stTime.setMilliseconds(0)

  for (let i = 0; i < 42; i++) {
    // Find end of time slot
    let edTime = new Date(stTime)
    do { edTime.setHours(edTime.getHours() + 1) }
    while (GROW_AT_HOURS.indexOf(edTime.getUTCHours()) === -1 && edTime.getUTCHours() !== 0)
    edTime.setSeconds(edTime.getSeconds() - 1)

    const floors = ["selene", "eos", "oceanus", "themis", "prometheus"]
      .map(name => getFloorAtTime(name, stTime))
    template.innerHTML =
      `<tr class="${i === 0 ? "table-primary" : ""}">
        <td>
          <span>${format(stTime, 'weekday')}</span>
          <span>${format(stTime, 'date')}</span>
          <span>${format(stTime, 'time')}</span>
          <span>-</span>
          <span>${format(edTime, 'time')}</span>
        </td>
        ${floors.map(floor =>
        `<td class="${floor >= 46 ? "table-success" : ""}">${floor}</td>`).join('')}
      </tr>`
    tbody.append(template.content.firstChild)

    edTime.setSeconds(edTime.getSeconds() + 1)
    stTime = edTime
  }
})