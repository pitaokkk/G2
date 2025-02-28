import { chartEmitSeriesTooltip as render } from '../plots/api/chart-emit-series-tooltip';
import { kebabCase } from './utils/kebabCase';
import {
  dispatchPlotEvent,
  createPromise,
  receiveExpectData,
} from './utils/event';
import { createNodeGCanvas } from './utils/createNodeGCanvas';
import './utils/useCustomFetch';
import './utils/useSnapshotMatchers';

describe('chart.emit', () => {
  const dir = `${__dirname}/snapshots/api/${kebabCase(render.name)}`;
  const canvas = createNodeGCanvas(800, 500);

  it('chart.emit and chart.on should control item tooltip display.', async () => {
    const { finished, chart, clear } = render({
      canvas,
      container: document.createElement('div'),
    });
    await finished;
    clear();

    // chart.emit("tooltip:show", options) should show tooltip.
    await expect(canvas).toMatchDOMSnapshot(dir, 'step0', {
      fileFormat: 'html',
      selector: '.g2-tooltip',
    });

    // chart.emit("tooltip:hide") should hide tooltip.
    chart.emit('tooltip:hide');
    await expect(canvas).toMatchDOMSnapshot(dir, 'step1', {
      fileFormat: 'html',
      selector: '.g2-tooltip',
    });

    chart.off();
    // chart.on("tooltip:show", callback) should revive selected data.
    const [tooltipShowed, resolveShow] = createPromise();
    chart.on('tooltip:show', (event) => {
      const { x } = event.data.data;
      expect(x.toUTCString()).toBe('Sat, 23 Jun 2007 12:58:35 GMT');
      resolveShow();
    });
    dispatchPlotEvent(canvas, 'pointermove', {
      offsetX: 100,
      offsetY: 100,
    });
    await tooltipShowed;

    // chart.on("tooltip:hide") should be called when hiding tooltip.
    const [tooltipHided, resolveHide] = createPromise();
    chart.on('tooltip:hide', receiveExpectData(resolveHide, null));
    dispatchPlotEvent(canvas, 'pointerleave');
    await tooltipHided;
  });

  afterAll(() => {
    canvas?.destroy();
  });
});
