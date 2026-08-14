const CESIUM_VERSION = "1.143";

function colorFromCss(value, fallback) {
  try {
    return Cesium.Color.fromCssColorString(value) ?? fallback;
  } catch {
    return fallback;
  }
}

export function initializeGlobeView(container, { onSelect, groundStation }) {
  let viewer;
  let visible = false;
  const entities = new Map();
  const trackEntities = new Map();
  const trackSources = new Map();
  const accessEntities = new Map();

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
      destination: Cesium.Cartesian3.fromDegrees(-110, 38, 22_000_000),
    });
    viewer.entities.add({
      name: `${groundStation.name} Ground Station`,
      position: Cesium.Cartesian3.fromDegrees(groundStation.longitude, groundStation.latitude, 0),
      point: {
        pixelSize: 12,
        color: colorFromCss("#73e6a2", Cesium.Color.LIME),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        disableDepthTestDistance: 0,
      },
      label: {
        text: `${groundStation.name} GS · ${groundStation.minimumElevation}° mask`,
        show: container.clientWidth > 480,
        font: "700 14px -apple-system, BlinkMacSystemFont, sans-serif",
        fillColor: colorFromCss("#dfffea", Cesium.Color.WHITE),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 4,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(14, -12),
        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        disableDepthTestDistance: 0,
      },
    });
    viewer.screenSpaceEventHandler.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.position);
      const satelliteId = picked?.id?.satelliteId;
      if (satelliteId) onSelect(String(satelliteId));
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    return viewer;
  }

  function update(items, {
    selectedIds = [],
    highlightedIds = [],
    groundTracksVisible = true,
  } = {}) {
    if (!visible) return;
    const activeViewer = ensureViewer();
    if (!activeViewer) return;
    const activeIds = new Set();
    for (const item of items) {
      if (!item.position) continue;
      activeIds.add(item.id);
      const selected = selectedIds.includes(item.id) || highlightedIds.includes(item.id);
      const hasAccess = item.position.groundElevation >= groundStation.minimumElevation;
      const pointColor = selected
        ? colorFromCss("#ffd166", Cesium.Color.YELLOW)
        : hasAccess
          ? Cesium.Color.BLACK
          : colorFromCss(item.color, Cesium.Color.CYAN);
      const outlineColor = hasAccess && !selected
        ? colorFromCss("#73e6a2", Cesium.Color.LIME)
        : Cesium.Color.WHITE;
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
        entity.point.outlineColor = outlineColor;
        entity.point.outlineWidth = hasAccess && !selected ? 4 : 2;
        entity.point.pixelSize = selected ? 14 : hasAccess ? 12 : 10;
        entity.label.show = selected;
        entity.label.text = `${item.label} · ${Math.round(item.position.altitude).toLocaleString()} km`;
      }

      let trackEntity = trackEntities.get(item.id);
      if (groundTracksVisible && item.trackPoints?.length > 1) {
        if (!trackEntity) {
          trackEntity = activeViewer.entities.add({
            name: `${item.label} ground path`,
            polyline: {
              positions: [],
              width: 3,
              material: colorFromCss(item.color, Cesium.Color.CYAN).withAlpha(0.78),
              arcType: Cesium.ArcType.GEODESIC,
            },
          });
          trackEntities.set(item.id, trackEntity);
        }
        trackEntity.show = true;
        if (trackSources.get(item.id) !== item.trackPoints) {
          trackEntity.polyline.positions = Cesium.Cartesian3.fromDegreesArrayHeights(
            item.trackPoints.flatMap(([latitude, longitude]) => [longitude, latitude, 5_000])
          );
          trackSources.set(item.id, item.trackPoints);
        }
      } else if (trackEntity) {
        trackEntity.show = false;
      }

      let accessPair = accessEntities.get(item.id);
      if (hasAccess) {
        const positions = [
          Cesium.Cartesian3.fromDegrees(groundStation.longitude, groundStation.latitude, 0),
          Cesium.Cartesian3.fromDegrees(item.position.longitude, item.position.latitude, item.position.altitude * 1000),
        ];
        if (!accessPair) {
          const halo = activeViewer.entities.add({
            name: `${groundStation.name} access to ${item.label}`,
            polyline: {
              positions,
              width: 7,
              material: Cesium.Color.BLACK.withAlpha(0.9),
              arcType: Cesium.ArcType.NONE,
            },
          });
          const line = activeViewer.entities.add({
            name: `${groundStation.name} access to ${item.label}`,
            polyline: {
              positions,
              width: 3,
              material: colorFromCss("#73e6a2", Cesium.Color.LIME),
              arcType: Cesium.ArcType.NONE,
            },
          });
          accessPair = { halo, line };
          accessEntities.set(item.id, accessPair);
        } else {
          accessPair.halo.polyline.positions = positions;
          accessPair.line.polyline.positions = positions;
          accessPair.halo.show = true;
          accessPair.line.show = true;
        }
      } else if (accessPair) {
        accessPair.halo.show = false;
        accessPair.line.show = false;
      }
    }
    for (const [id, entity] of entities) {
      if (activeIds.has(id)) continue;
      activeViewer.entities.remove(entity);
      entities.delete(id);
      const trackEntity = trackEntities.get(id);
      if (trackEntity) activeViewer.entities.remove(trackEntity);
      trackEntities.delete(id);
      trackSources.delete(id);
      const accessPair = accessEntities.get(id);
      if (accessPair) {
        activeViewer.entities.remove(accessPair.halo);
        activeViewer.entities.remove(accessPair.line);
      }
      accessEntities.delete(id);
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
    if (viewer) {
      for (const entity of entities.values()) viewer.entities.remove(entity);
      for (const entity of trackEntities.values()) viewer.entities.remove(entity);
      for (const pair of accessEntities.values()) {
        viewer.entities.remove(pair.halo);
        viewer.entities.remove(pair.line);
      }
    }
    entities.clear();
    trackEntities.clear();
    trackSources.clear();
    accessEntities.clear();
  }

  return { clear, setVisible, update };
}
