import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import type { Lot } from '../types/lot'
import { formatArea, formatRub } from '../lib/format'
import { useFiltersStore } from '../store/filters'

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

const SPB_CENTER: [number, number] = [59.9343, 30.3351]

type MapViewProps = {
  lots: Lot[]
}

function FlyToSelected({ lots }: { lots: Lot[] }) {
  const map = useMap()
  const selectedLotId = useFiltersStore((s) => s.selectedLotId)

  useEffect(() => {
    if (!selectedLotId) return
    const lot = lots.find((item) => item.id === selectedLotId)
    if (!lot || lot.lat === null || lot.lon === null) return
    map.flyTo([lot.lat, lot.lon], 15, { duration: 0.6 })
  }, [selectedLotId, lots, map])

  return null
}

export function MapView({ lots }: MapViewProps) {
  const setSelectedLotId = useFiltersStore((s) => s.setSelectedLotId)
  const mappable = lots.filter(
    (lot): lot is Lot & { lat: number; lon: number } =>
      lot.lat !== null && lot.lon !== null,
  )

  return (
    <MapContainer
      center={SPB_CENTER}
      zoom={11}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected lots={mappable} />
      {mappable.map((lot) => (
        <Marker
          key={lot.id}
          position={[lot.lat, lot.lon]}
          eventHandlers={{
            click: () => setSelectedLotId(lot.id),
          }}
        >
          <Popup>
            <div className="min-w-[160px] space-y-1 text-sm">
              <p className="font-semibold leading-snug">{lot.title}</p>
              <p>{formatRub(lot.price)}</p>
              <p className="text-[var(--muted)]">{formatArea(lot.area)}</p>
              <button
                type="button"
                className="text-[var(--accent)] underline"
                onClick={() => setSelectedLotId(lot.id)}
              >
                Подробнее
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
