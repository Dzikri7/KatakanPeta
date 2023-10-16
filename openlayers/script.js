const map = new ol.Map({
    target: 'map',
    view: new ol.View({
        center: ol.proj.fromLonLat([107.58032031133888, -6.878124785406527]),
        zoom: 14.6
    })
});

const tileLayer = new ol.layer.Tile({
    source: new ol.source.OSM()
});
map.addLayer(tileLayer);

function addGeoJSONToMapAndTable(geoJSONUrl, map, table) {
    fetch(geoJSONUrl)
        .then(response => response.json())
        .then(data => {
            const vectorSource = new ol.source.Vector({
                features: (new ol.format.GeoJSON()).readFeatures(data)
            });
            const vectorLayer = new ol.layer.Vector({
                source: vectorSource
            });
            map.addLayer(vectorLayer);

            let rowNum = 1;

            const tableBody = document.getElementById('geojson-table');

            data.features.forEach(feature => {
                const row = tableBody.insertRow();
                const numCell = row.insertCell(0);
                const nameCell = row.insertCell(1);
                const desaCell = row.insertCell(2);
                const coordCell = row.insertCell(3);
                const typeCell = row.insertCell(4);
                numCell.innerHTML = rowNum;
                nameCell.innerHTML = feature.properties.name;
                desaCell.innerHTML = feature.properties.desa;

                const coordinates = feature.geometry.coordinates;
                let coordinateString = "";

                if (feature.geometry.type === "Point") {
                    const lat = coordinates[1];
                    const long = coordinates[0];
                    coordinateString = `${lat}, ${long}`;

                    const iconUrl = feature.properties.icon;
                    const iconUrl2 = feature.properties.icon2;

                    const marker = new ol.Feature({
                        geometry: new ol.geom.Point(ol.proj.fromLonLat([long, lat]))
                    });

                    if (iconUrl || iconUrl2) {
                        const markerStyle = new ol.style.Style({
                            image: new ol.style.Icon({
                                src: iconUrl || iconUrl2,
                                scale: 0.1
                            }),
                        });
                        marker.setStyle(markerStyle);
                    }

                    vectorSource.addFeature(marker);
                } else if (feature.geometry.type === "Polygon") {
                    const coordinates = feature.geometry.coordinates;
                    const polygonCoordinates = coordinates.map(linearRingCoords => {
                        return linearRingCoords.map(coordinate => {
                            return ol.proj.fromLonLat(coordinate);
                        });
                    });

                    const polygon = new ol.geom.Polygon(polygonCoordinates);

                    const featureGeom = new ol.Feature({
                        geometry: polygon
                    });
                    vectorSource.addFeature(featureGeom);
                } else if (feature.geometry.type === "LineString") {
                    const coordinates = feature.geometry.coordinates;
                    const lineStringCoords = coordinates.map(coordinate => {
                        return ol.proj.fromLonLat(coordinate);
                    });

                    if (feature.properties.curve) {
                        const curve = feature.properties.curve;
                        const curveLineStringCoords = [];

                        for (let i = 0; i < lineStringCoords.length - 1; i++) {
                            curveLineStringCoords.push(lineStringCoords[i]);

                            for (let t = 0.1; t <= 0.9; t += 0.1) {
                                const x = (1 - t) * (1 - t) * lineStringCoords[i][0] +
                                          2 * (1 - t) * t * curve[i][0] +
                                          t * t * lineStringCoords[i + 1][0];

                                const y = (1 - t) * (1 - t) * lineStringCoords[i][1] +
                                          2 * (1 - t) * t * curve[i][1] +
                                          t * t * lineStringCoords[i + 1][1];

                                curveLineStringCoords.push([x, y]);
                            }
                        }

                        curveLineStringCoords.push(lineStringCoords[lineStringCoords.length - 1]);

                        const curveLineString = new ol.geom.LineString(curveLineStringCoords);
                        const featureGeom = new ol.Feature({
                            geometry: curveLineString
                        });
                        vectorSource.addFeature(featureGeom);
                    } else {
                        const lineString = new ol.geom.LineString(lineStringCoords);
                        const featureGeom = new ol.Feature({
                            geometry: lineString
                        });
                        vectorSource.addFeature(featureGeom);
                    }
                }

                coordinates.forEach(coordinate => {
                    const lat = coordinate[1];
                    const long = coordinate[0];
                    coordinateString += `${lat}, ${long}<br>`;
                });

                coordCell.innerHTML = coordinateString;
                typeCell.innerHTML = feature.geometry.type;
                rowNum++;
            });
        })
        .catch(error => {
            console.error('Error fetching GeoJSON:', error);
        });
}

// Call the function for each GeoJSON URL
addGeoJSONToMapAndTable('https://raw.githubusercontent.com/Dzikri7/KatakanPeta/main/openlayers/json/point.json', map, document.querySelector('table'));
addGeoJSONToMapAndTable('https://raw.githubusercontent.com/Dzikri7/KatakanPeta/main/openlayers/json/poliline.json', map, document.querySelector('table'));
addGeoJSONToMapAndTable('https://raw.githubusercontent.com/Dzikri7/KatakanPeta/main/openlayers/json/polygon.json', map, document.querySelector('table'));
