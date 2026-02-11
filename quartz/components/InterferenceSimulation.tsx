import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/interference.inline"

export default (() => {
  const InterferenceSimulation: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <div class={`interference-simulation ${displayClass ?? ""}`}>
        <div class="sim-container">
          <h3>Wave Interference Experiment</h3>
          <canvas id="interference-canvas" width="800" height="400"></canvas>
          <div class="controls">
            <label>
              Wave Frequency: <span id="freq-value">5</span> Hz
              <input type="range" id="frequency" min="1" max="15" value="5" step="0.5" />
            </label>
            <label>
              Source Separation: <span id="sep-value">80</span> px
              <input type="range" id="separation" min="40" max="200" value="80" step="10" />
            </label>
            <label>
              <input type="checkbox" id="show-sources" checked />
              Show Sources
            </label>
          </div>
        </div>
      </div>
    )
  }

  InterferenceSimulation.afterDOMLoaded = script

  InterferenceSimulation.css = `
    .interference-simulation {
      margin: 2rem 0;
      padding: 1.5rem;
      background: var(--lightgray);
      border-radius: 8px;
      border: 1px solid var(--gray);
    }

    .sim-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .sim-container h3 {
      margin: 0 0 1rem 0;
      color: var(--dark);
      font-size: 1.2rem;
    }

    #interference-canvas {
      background: var(--light);
      border: 2px solid var(--gray);
      border-radius: 4px;
      cursor: crosshair;
      max-width: 100%;
      height: auto;
    }

    .controls {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      width: 100%;
      max-width: 600px;
    }

    .controls label {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.9rem;
      color: var(--dark);
    }

    .controls input[type="range"] {
      width: 100%;
    }

    .controls input[type="checkbox"] {
      width: auto;
      margin-right: 0.5rem;
    }

    @media (max-width: 640px) {
      .interference-simulation {
        padding: 1rem;
      }

      #interference-canvas {
        width: 100%;
      }
    }
  `

  return InterferenceSimulation
}) satisfies QuartzComponentConstructor
