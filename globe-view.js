const CESIUM_VERSION = "1.143";

function colorFromCss(value, fallback) {
  try {
    return Cesium.Color.fromCssColorString(value) ?? fallback;
  } catch {
    return fallback;
  }
}

export function initializeGlobeView(container, { onSelect }) {
  let viewer;
  let visible = false;
  const entities = new Map();

  function ensureViewer() {
    if (viewer || !window.Cesium) return viewer;
    window.CESIUM_BASE_URL = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium/`;
    viewer = new Cesium.Viewer(container, {
      animation: false,
      baseLayer: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
    });
    viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      maximumLevel: 8,
      credit: new Cesium.Credit("© OpenStreetMap contributors"),
    }));
    viewer.scene.globe.baseColor = colorFromCss("#9cc9d7", Cesium.Color.LIGHTBLUE);
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 6_500_000;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 60_000_000;
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-25, 24, 22_000_000),
    });
    viewer.screenSpaceEventHandler.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.position);
      const satelliteId = picked?.id?.satelliteId;
      if (satelliteId) onSelect(String(satelliteId));
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    return viewer;
  }

  function update(items, selectedIds = [], highlightedIds = []) {
    if (!visible) return;
    const activeViewer = ensureViewer();
    if (!activeViewer) return;
    const activeIds = new Set();
    for (const item of items) {
      if (!item.position) continue;
      activeIds.add(item.id);
      const selected = selectedIds.includes(item.id) || highlightedIds.includes(item.id);
      const pointColor = selected
        ? Cesium.Color.fromCssColorString("#ffd166")
        : colorFromCss(item.color, Cesium.Color.CYAN);
      let entity = entities.get(item.id);
      if (!entity) {
        entity = activeViewer.entities.add({
          name: item.label,
          position: Cesium.Cartesian3.fromDegrees(item.position.longitude, item.position.latitude, item.position.altitude * 1000),
          point: {
            pixelSize: 10,
            color: pointColor,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: 0,
          },
          label: {
            text: item.label,
            show: selected,
            font: "700 15px -apple-system, BlinkMacSystemFont, sans-serif",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 4,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(12, -10),
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            disableDepthTestDistance: 0,
          },
        });
        entity.addProperty("satelliteId");
        entity.satelliteId = item.id;
        entities.set(item.id, entity);
      } else {
        entity.position = Cesium.Cartesian3.fromDegrees(item.position.longitude, item.position.latitude, item.position.altitude * 1000);
        entity.point.color = pointColor;
        entity.point.pixelSize = selected ? 14 : 10;
        entity.label.show = selected;
        entity.label.text = `${item.label} · ${Math.round(item.position.altitude).toLocaleString()} km`;
      }
    }
    for (const [id, entity] of entities) {
      if (activeIds.has(id)) continue;
      activeViewer.entities.remove(entity);
      entities.delete(id);
    }
    activeViewer.scene.requestRender();
  }

  function setVisible(nextVisible) {
    visible = nextVisible;
    if (!visible) return;
    ensureViewer()?.resize();
    viewer?.scene.requestRender();
  }

  function clear() {
    if (viewer) viewer.entities.removeAll();
    entities.clear();
  }

  return { clear, setVisible, update };
}
