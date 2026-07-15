"use client"

import { useState, useEffect } from 'react'

interface Spot {
  id: number
  lokasi: string
  jam: string
  ongkir: number
  hari: number
  tanggal: string
}

export default function Home() {
  const [data, setData] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingJarak, setLoadingJarak] = useState(false)
  const [hariFilter, setHariFilter] = useState<string>('all')
  const [posisi, setPosisi] = useState({ lat: null as number | null, lng: null as number | null, nama: 'Mendeteksi...' })
  const [jam, setJam] = useState('')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [rekomendasi, setRekomendasi] = useState<any[]>([])

  const [halaman, setHalaman] = useState<'home' | 'tambah' | 'malam' | 'kelola' | 'backup'>('home')

  const [inputLokasi, setInputLokasi] = useState('')
  const [inputJam, setInputJam] = useState('')
  const [inputOngkir, setInputOngkir] = useState('')
  const [inputHari, setInputHari] = useState('')

  const [rowsMalam, setRowsMalam] = useState<{ jam: string; lokasi: string; ongkir: string }[]>([])
  const [cariKeyword, setCariKeyword] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [halaman])

  const formatJamOtomatis = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 0) return ''
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length === 3) return `${cleaned.slice(0, 1)}:${cleaned.slice(1)}`
    if (cleaned.length >= 4) return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`
    return cleaned
  }

  useEffect(() => {
    const saved = localStorage.getItem('gerakDuluData')
    if (saved) setData(JSON.parse(saved))
    setLoading(false)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          setPosisi(prev => ({ ...prev, lat: latitude, lng: longitude }))
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=16`)
            const data = await res.json()
            let nama = 'Bandung'
            if (data.address) {
              const a = data.address
              nama = a.road || a.suburb || a.village || a.town || a.city || 'Bandung'
            }
            setPosisi(prev => ({ ...prev, nama }))
          } catch (e) {
            setPosisi(prev => ({ ...prev, nama: 'Bandung' }))
          }
        },
        () => setPosisi(prev => ({ ...prev, nama: 'Izin Lokasi' }))
      )
    }
  }, [])

  useEffect(() => {
    const updateJam = () => {
      const now = new Date()
      setJam(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
    }
    updateJam()
    const interval = setInterval(updateJam, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        setIsInstalled(true)
        setDeferredPrompt(null)
      }
    }
  }

  const getData = () => {
    try {
      const raw = localStorage.getItem('gerakDuluData')
      if (!raw) return []
      return JSON.parse(raw)
    } catch { return [] }
  }

  const setDataStorage = (newData: Spot[]) => {
    localStorage.setItem('gerakDuluData', JSON.stringify(newData))
    setData(newData)
  }

  const getNextId = (data: Spot[]) => {
    if (data.length === 0) return 1
    return Math.max(...data.map(d => d.id)) + 1
  }

  const bulatkanJam = (jamStr: string) => {
    if (!jamStr) return ''
    let clean = jamStr
    if (!clean.includes(':')) {
      const digits = clean.replace(/\D/g, '')
      if (digits.length <= 2) return digits.padStart(2, '0')
      if (digits.length === 3) return `${digits.slice(0, 1)}:${digits.slice(1)}`
      if (digits.length >= 4) return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
      return clean
    }
    const [h, m] = jamStr.split(':').map(Number)
    if (isNaN(h) || isNaN(m)) return jamStr
    const roundedM = Math.round(m / 15) * 15
    let newH = h
    let newM = roundedM
    if (newM === 60) { newH = (h + 1) % 24; newM = 0 }
    if (newM === -15) { newH = (h - 1 + 24) % 24; newM = 45 }
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
  }

  const getBintang = (jam: string, lokasi: string) => {
    const filtered = data.filter(d => d.jam === jam && d.lokasi.toLowerCase() === lokasi.toLowerCase())
    const count = filtered.length
    let bintang = '⭐'
    if (count >= 5) bintang = '⭐⭐⭐⭐⭐'
    else if (count >= 4) bintang = '⭐⭐⭐⭐'
    else if (count >= 3) bintang = '⭐⭐⭐'
    else if (count >= 2) bintang = '⭐⭐'
    return { bintang, count }
  }

  const getKoordinatDariAlamat = async (alamat: string) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(alamat + ', Bandung')}&format=json&limit=1`)
      const data = await res.json()
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      }
    } catch (e) {}
    return null
  }

  const hitungJarakOSRM = async (lat1: number, lng1: number, lat2: number, lng2: number) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`
      const res = await fetch(url)
      const data = await res.json()
      if (data.routes && data.routes.length > 0) {
        const meters = data.routes[0].distance
        return Math.round(meters / 1000 * 10) / 10
      }
      return null
    } catch (e) {
      return null
    }
  }

  const getRekomendasi = async () => {
    if (data.length === 0) return []

    setLoadingJarak(true)

    let filtered = data
    if (hariFilter !== 'all') {
      filtered = data.filter((d: Spot) => d.hari === parseInt(hariFilter))
    }

    const rekomWithDetails: any[] = []

    for (const item of filtered) {
      const { bintang, count } = getBintang(item.jam, item.lokasi)

      rekomWithDetails.push({
        ...item,
        bintang,
        count,
        jarak: 0,
        lat: null,
        lng: null
      })
    }

    rekomWithDetails.sort((a, b) => {
      if (a.jarak !== null && b.jarak !== null && a.jarak !== b.jarak) {
        return a.jarak - b.jarak
      }
      const bintangA = a.bintang.length
      const bintangB = b.bintang.length
      if (bintangA !== bintangB) return bintangB - bintangA
      return b.ongkir - a.ongkir
    })

    setLoadingJarak(false)
    return rekomWithDetails
  }

  const hariNama = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

  const simpanSpot = () => {
    if (!inputLokasi || !inputJam || !inputOngkir || parseInt(inputOngkir) <= 0) {
      alert('Isi semua data dengan benar!')
      return
    }
    const jam = bulatkanJam(inputJam)
    const hari = inputHari !== '' ? parseInt(inputHari) : new Date().getDay()
    const dataNow = getData()
    dataNow.push({
      id: getNextId(dataNow),
      lokasi: inputLokasi,
      jam: jam,
      ongkir: parseInt(inputOngkir),
      hari: hari,
      tanggal: new Date().toISOString()
    })
    setDataStorage(dataNow)
    setInputLokasi('')
    setInputJam('')
    setInputOngkir('')
    setInputHari('')
    setHalaman('home')
    getRekomendasi().then(setRekomendasi)
  }

  const tambahBarisMalam = () => {
    setRowsMalam([...rowsMalam, { jam: '', lokasi: '', ongkir: '' }])
  }

  const updateRowMalam = (index: number, field: 'jam' | 'lokasi' | 'ongkir', value: string) => {
    const newRows = [...rowsMalam]
    newRows[index][field] = value
    setRowsMalam(newRows)
  }

  const hapusRowMalam = (index: number) => {
    setRowsMalam(rowsMalam.filter((_, i) => i !== index))
  }

  const simpanSemuaMalam = () => {
    const dataNow = getData()
    let added = 0
    const hari = new Date().getDay()
    for (const row of rowsMalam) {
      if (!row.jam || !row.lokasi || !row.ongkir || parseInt(row.ongkir) <= 0) continue
      const jam = bulatkanJam(row.jam)
      dataNow.push({
        id: getNextId(dataNow),
        lokasi: row.lokasi,
        jam: jam,
        ongkir: parseInt(row.ongkir),
        hari: hari,
        tanggal: new Date().toISOString()
      })
      added++
    }
    setDataStorage(dataNow)
    setRowsMalam([])
    alert(`✅ ${added} spot berhasil disimpan!`)
    setHalaman('home')
    getRekomendasi().then(setRekomendasi)
  }

  const hapusSpot = (id: number) => {
    if (!confirm('Hapus spot ini?')) return
    const dataNow = getData()
    setDataStorage(dataNow.filter((d: Spot) => d.id !== id))
    getRekomendasi().then(setRekomendasi)
  }

  const exportData = () => {
    const dataNow = getData()
    if (dataNow.length === 0) { alert('Belum ada data!'); return }
    const blob = new Blob([JSON.stringify(dataNow, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gerakdulu_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(imported)) { alert('Format tidak valid!'); return }
        let dataNow = getData()
        for (const item of imported) {
          if (item.lokasi && item.jam && item.ongkir) {
            dataNow.push({
              id: getNextId(dataNow),
              lokasi: item.lokasi,
              jam: item.jam,
              ongkir: item.ongkir,
              hari: item.hari !== undefined ? item.hari : new Date(item.tanggal || Date.now()).getDay(),
              tanggal: item.tanggal || new Date().toISOString()
            })
          }
        }
        setDataStorage(dataNow)
        alert(`✅ ${imported.length} data di-import!`)
        setHalaman('home')
        getRekomendasi().then(setRekomendasi)
      } catch (err) {
        alert('Gagal import! Pastikan file .json.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const loadRekomendasi = () => {
    if (!loading && data.length > 0) {
      getRekomendasi().then(setRekomendasi)
    }
  }

  useEffect(() => {
    loadRekomendasi()
    const interval = setInterval(loadRekomendasi, 60000)
    return () => clearInterval(interval)
  }, [data, loading, hariFilter])

  const renderHome = () => {
    const utama = rekomendasi.length > 0 ? rekomendasi[0] : null
    const lain = rekomendasi.slice(1)

    const totalSpot = data.length
    const countMap: Record<string, { lokasi: string; count: number }> = {}
    for (const item of data) {
      const key = item.lokasi.toLowerCase()
      if (!countMap[key]) countMap[key] = { lokasi: item.lokasi, count: 0 }
      countMap[key].count++
    }
    let favorit = '-'
    let maxCount = 0
    for (const key in countMap) {
      if (countMap[key].count > maxCount) {
        maxCount = countMap[key].count
        favorit = countMap[key].lokasi
      }
    }
    const totalOngkir = data.reduce((sum, d) => sum + d.ongkir, 0)
    const rataOngkir = data.length > 0 ? Math.round(totalOngkir / data.length) : 0
    const maxOngkir = data.length > 0 ? Math.max(...data.map(d => d.ongkir)) : 0

    return (
      <div className="halaman">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(12px, 3vw, 16px)' }}>
          <h1 style={{ fontSize: 'clamp(22px, 5.5vw, 30px)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 10px)' }}>
            <img src="/favicon.ico" alt="logo" style={{ width: 'clamp(28px, 7vw, 36px)', height: 'clamp(28px, 7vw, 36px)' }} />
            <span>GERAK <span style={{ color: '#ff6b00' }}>DULU</span></span>
          </h1>
          <span style={{ color: '#ff6b00', fontWeight: 700, fontSize: 'clamp(18px, 4.5vw, 24px)' }}>⏰ {jam}</span>
        </div>

        <div className="posisi-bar">
          <span className="label">📍 LOKASI</span>
          <span className="value">{posisi.nama}</span>
        </div>

        <div className="filter-grid">
          <button className={hariFilter === 'all' ? 'active' : ''} onClick={() => setHariFilter('all')}>Semua</button>
          {[0, 1, 2, 3, 4, 5, 6].map((h) => (
            <button key={h} className={hariFilter === String(h) ? 'active' : ''} onClick={() => setHariFilter(String(h))}>
              {hariNama[h]}
            </button>
          ))}
        </div>

        {loadingJarak && (
          <div style={{ textAlign: 'center', padding: '12px', color: '#8888aa' }}>
            <span>⏳ Menghitung jarak real...</span>
          </div>
        )}

        <div className="rekom-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="badge-orange">🎯 REKOMENDASI</span>
            <span className="bintang">{utama ? utama.bintang : '⭐'}</span>
          </div>
          <div className="lokasi" style={{ fontSize: 'clamp(18px, 4.5vw, 24px)' }}>
            {utama ? utama.lokasi : 'Belum ada data'}
          </div>
          <div className="detail">
            <span>⏰ {utama ? utama.jam : '--:--'}</span>
            <span>🛵 {utama ? `${utama.count}x dapet` : '-'}</span>
            <span>📏 {utama && utama.jarak !== null ? `${utama.jarak} km` : '?'}</span>
            <span>💰 {utama ? `Rp ${utama.ongkir.toLocaleString()}` : '-'}</span>
          </div>
          <button 
            className="btn-primary" 
            onClick={() => {
              if (utama) {
                const searchQuery = encodeURIComponent(utama.lokasi)
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${searchQuery}&travelmode=driving`, '_blank')
              }
            }}
          >
            🚀 NAVIGASI KE TITIK INI
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 600 }}>📋 SPOT LAIN</span>
            <span className="text-muted">{lain.length} spot</span>
          </div>
          {lain.length === 0 ? (
            <div style={{ color: '#8888aa', textAlign: 'center', padding: 'clamp(16px, 4vw, 24px)' }}>Tidak ada spot lain.</div>
          ) : (
            lain.map((item) => (
              <div key={item.id} className="spot-item">
                <div className="kiri">
                  <div className="nama">{item.bintang} {item.lokasi}</div>
                  <div className="jam">⏰ {item.jam} 💰 Rp {item.ongkir.toLocaleString()} ({item.count}x) 📏 {item.jarak !== null ? `${item.jarak} km` : '?'}</div>
                </div>
                <div className="kanan">{item.count}x</div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-header"><span style={{ fontWeight: 600 }}>📊 STATISTIK</span></div>
          <div className="stat-grid">
            <div className="stat-item"><div className="angka">{totalSpot}</div><div className="label">Total Spot</div></div>
            <div className="stat-item"><div className="angka">{favorit}</div><div className="label">Spot Favorit</div></div>
            <div className="stat-item"><div className="angka">Rp{rataOngkir.toLocaleString()}</div><div className="label">Rata-rata Ongkir</div></div>
            <div className="stat-item"><div className="angka">Rp{maxOngkir.toLocaleString()}</div><div className="label">Ongkir Tertinggi</div></div>
          </div>
        </div>

        <div className="bottom-grid">
          <button className="orange" onClick={() => setHalaman('tambah')}>➕ Tambah</button>
          <button onClick={() => setHalaman('malam')}>🌙 Malam</button>
          <button onClick={() => setHalaman('kelola')}>📋 Kelola</button>
          <button onClick={() => setHalaman('backup')}>💾 Backup</button>
          <button onClick={() => window.location.reload()}>📍 Refresh</button>
          {!isInstalled ? (
            <button className="orange" onClick={handleInstall}>📲 Install</button>
          ) : (
            <button style={{ opacity: 0.4, cursor: 'default', background: '#2a2a3e', color: '#888' }}>✅ Terinstall</button>
          )}
        </div>
      </div>
    )
  }

  const renderTambah = () => (
    <div className="halaman">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
        <h2 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700 }}>📝 Tambah Spot</h2>
        <button className="btn-close" onClick={() => setHalaman('home')}>✕</button>
      </div>
      <div className="input-group">
        <label>Lokasi (isi alamat jelas)</label>
        <input 
          value={inputLokasi} 
          onChange={(e) => setInputLokasi(e.target.value)} 
          placeholder="Jl. Cihampelas No. 123" 
        />
        <div style={{ fontSize: '11px', color: '#8888aa', marginTop: '4px' }}>Makin detail, makin akurat navigasi & jarak</div>
      </div>
      <div className="input-group">
        <label>Jam</label>
        <input 
          value={inputJam} 
          onChange={(e) => setInputJam(formatJamOtomatis(e.target.value))} 
          placeholder="1030" 
        />
        <div style={{ fontSize: '11px', color: '#8888aa', marginTop: '4px' }}>Cukup ketik angka (contoh: 1030 → 10:30)</div>
      </div>
      <div className="input-group">
        <label>Ongkir (Rp)</label>
        <input value={inputOngkir} onChange={(e) => setInputOngkir(e.target.value)} placeholder="15000" type="number" />
      </div>
      <div className="input-group">
        <label>Hari</label>
        <select value={inputHari} onChange={(e) => setInputHari(e.target.value)}>
          <option value="">Otomatis (hari ini)</option>
          <option value="0">Minggu</option><option value="1">Senin</option>
          <option value="2">Selasa</option><option value="3">Rabu</option>
          <option value="4">Kamis</option><option value="5">Jumat</option>
          <option value="6">Sabtu</option>
        </select>
      </div>
      <button className="btn-primary" onClick={simpanSpot}>💾 Simpan</button>
    </div>
  )

  const renderMalam = () => (
    <div className="halaman">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
        <h2 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700 }}>🌙 Input Malam</h2>
        <button className="btn-close" onClick={() => setHalaman('home')}>✕</button>
      </div>
      <div className="text-muted" style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>📅 {new Date().toLocaleDateString('id-ID')}</div>
      
      <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
        {rowsMalam.map((row, index) => (
          <div key={index} style={{ 
            background: '#12121f', 
            borderRadius: '12px', 
            padding: '12px', 
            marginBottom: '12px',
            border: '1px solid #2a2a3e'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: '#8888aa', display: 'block', marginBottom: '4px' }}>Jam</label>
              <input 
                value={row.jam} 
                onChange={(e) => updateRowMalam(index, 'jam', formatJamOtomatis(e.target.value))} 
                placeholder="1035" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  border: '1px solid #2a2a3e', 
                  background: '#0a0a0f', 
                  color: '#fff', 
                  fontSize: '16px',
                  minHeight: '44px'
                }} 
              />
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: '#8888aa', display: 'block', marginBottom: '4px' }}>Lokasi</label>
              <input 
                value={row.lokasi} 
                onChange={(e) => updateRowMalam(index, 'lokasi', e.target.value)} 
                placeholder="Jl. Cihampelas No. 123" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  border: '1px solid #2a2a3e', 
                  background: '#0a0a0f', 
                  color: '#fff', 
                  fontSize: '16px',
                  minHeight: '44px'
                }} 
              />
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', color: '#8888aa', display: 'block', marginBottom: '4px' }}>Ongkir (Rp)</label>
              <input 
                value={row.ongkir} 
                onChange={(e) => updateRowMalam(index, 'ongkir', e.target.value)} 
                placeholder="15000" 
                type="number" 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  border: '1px solid #2a2a3e', 
                  background: '#0a0a0f', 
                  color: '#fff', 
                  fontSize: '16px',
                  minHeight: '44px'
                }} 
              />
            </div>
            
            <button 
              onClick={() => hapusRowMalam(index)} 
              style={{ 
                background: '#ff4444', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '10px', 
                padding: '10px', 
                width: '100%', 
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              ✕ Hapus Baris
            </button>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)', flexWrap: 'wrap' }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={tambahBarisMalam}>➕ Baris</button>
        <button className="btn-primary" style={{ flex: 2 }} onClick={simpanSemuaMalam}>💾 Simpan Semua</button>
      </div>
    </div>
  )

  const renderKelola = () => {
    const filtered = data.filter((d: Spot) => d.lokasi.toLowerCase().includes(cariKeyword.toLowerCase()))
    return (
      <div className="halaman">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
          <h2 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700 }}>📋 Semua Spot</h2>
          <button className="btn-close" onClick={() => setHalaman('home')}>✕</button>
        </div>
        <div className="input-group">
          <label>🔍 Cari</label>
          <input value={cariKeyword} onChange={(e) => setCariKeyword(e.target.value)} placeholder="Cari lokasi..." />
        </div>
        {filtered.length === 0 ? (
          <div style={{ color: '#8888aa', textAlign: 'center', padding: 'clamp(20px, 5vw, 32px)' }}>Tidak ada data.</div>
        ) : (
          filtered.map((item) => {
            const { bintang, count } = getBintang(item.jam, item.lokasi)
            return (
              <div key={item.id} className="spot-item">
                <div className="kiri">
                  <div className="nama">{bintang} ({count}x) {item.lokasi}</div>
                  <div className="jam">⏰ {item.jam} 💰 Rp {item.ongkir.toLocaleString()} 📅 {new Date(item.tanggal).toLocaleDateString('id-ID')}</div>
                </div>
                <button className="btn-danger" onClick={() => hapusSpot(item.id)}>🗑️</button>
              </div>
            )
          })
        )}
        <div className="text-muted" style={{ marginTop: 'clamp(10px, 2.5vw, 14px)' }}>Total: {filtered.length} spot</div>
      </div>
    )
  }

  const renderBackup = () => (
    <div className="halaman">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
        <h2 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700 }}>💾 Backup</h2>
        <button className="btn-close" onClick={() => setHalaman('home')}>✕</button>
      </div>
      <button className="btn-primary" onClick={exportData} style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>📤 Export .json</button>
      <div className="input-group">
        <label>📥 Import .json</label>
        <input type="file" accept=".json" onChange={importData} style={{ padding: 'clamp(12px, 3vw, 16px)', fontSize: 'clamp(14px, 3.5vw, 17px)' }} />
      </div>
      <div className="text-muted">Total spot: {data.length}</div>
    </div>
  )

  if (loading) {
    return (
      <div style={{ background: '#0a0a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 'clamp(16px, 4vw, 20px)' }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <main style={{ background: '#0a0a0f', minHeight: '100vh', padding: 'clamp(10px, 3vw, 16px)', paddingBottom: '100px', color: '#fff' }}>
      <div className="container">
        {halaman === 'home' && renderHome()}
        {halaman === 'tambah' && renderTambah()}
        {halaman === 'malam' && renderMalam()}
        {halaman === 'kelola' && renderKelola()}
        {halaman === 'backup' && renderBackup()}
      </div>

      <div style={{
        textAlign: 'center',
        paddingTop: 'clamp(24px, 6vw, 40px)',
        paddingBottom: 'clamp(12px, 3vw, 20px)',
        borderTop: '1px solid #2a2a3e',
        marginTop: 'clamp(20px, 5vw, 32px)',
        color: '#8888aa',
        fontSize: 'clamp(12px, 2.8vw, 14px)',
      }}>
        <p>Dibuat oleh <span style={{ color: '#ff6b00', fontWeight: 600 }}>mpermana99</span></p>
        <p style={{ fontSize: 'clamp(10px, 2.2vw, 12px)', marginTop: '4px', color: '#6b6b8a' }}>
          © {new Date().getFullYear()} • Gerak Dulu
        </p>
      </div>
    </main>
  )
}