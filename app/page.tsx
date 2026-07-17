"use client"

import { useState, useEffect } from 'react'

interface Spot {
  id: number
  lokasi: string
  jam: string
  ongkir: number
  hari: number
  tanggal: string
  lat?: number | null
  lng?: number | null
  daerah?: string | null
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

  const [halaman, setHalaman] = useState<'home' | 'tambah' | 'kelola' | 'backup' | 'statistik'>('home')

  const [inputLokasi, setInputLokasi] = useState('')
  const [inputJam, setInputJam] = useState('')
  const [inputOngkir, setInputOngkir] = useState('')
  const [inputHari, setInputHari] = useState('')

  const [cariKeyword, setCariKeyword] = useState('')

  const [editData, setEditData] = useState<Spot | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editLokasi, setEditLokasi] = useState('')
  const [editJam, setEditJam] = useState('')
  const [editOngkir, setEditOngkir] = useState('')
  const [editHari, setEditHari] = useState('')

  // ============== KELOLA STATE ==============
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // ============== STATISTIK STATE ==============
  const [statHariFilter, setStatHariFilter] = useState<string>('all')
  const [showDropdown, setShowDropdown] = useState(false)

  // ============== AUTOCOMPLETE STATE ==============
  const [saranLokasi, setSaranLokasi] = useState<any[]>([])
  const [showSaran, setShowSaran] = useState(false)
  const [isLoadingSaran, setIsLoadingSaran] = useState(false)

  // ============== AUTOCOMPLETE EDIT STATE ==============
  const [saranLokasiEdit, setSaranLokasiEdit] = useState<any[]>([])
  const [showSaranEdit, setShowSaranEdit] = useState(false)
  const [isLoadingSaranEdit, setIsLoadingSaranEdit] = useState(false)

  // ============== RESET PAGE SAAT SEARCH ==============
  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds(new Set())
    setSelectAll(false)
  }, [cariKeyword])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [halaman])

  // ============== TOMBOL BACK HP ==============
  useEffect(() => {
    const handlePopState = () => {
      if (halaman !== 'home') {
        setHalaman('home')
        window.history.pushState(null, '', window.location.href)
      }
    }

    window.addEventListener('popstate', handlePopState)

    if (halaman !== 'home') {
      window.history.pushState(null, '', window.location.href)
    }

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [halaman])

  // ============== SCREEN WAKE LOCK ==============
  useEffect(() => {
    let wakeLock: any = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch (err) {}
    }

    requestWakeLock()

    return () => {
      if (wakeLock) {
        wakeLock.release()
      }
    }
  }, [])

  const formatJamOtomatis = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 0) return ''
    if (cleaned.length <= 2) return cleaned
    if (cleaned.length === 3) return `${cleaned.slice(0, 1)}:${cleaned.slice(1)}`
    if (cleaned.length >= 4) return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`
    return cleaned
  }

  // ============== AUTOCOMPLETE FUNCTION ==============
  const cariSaranLokasi = async (query: string) => {
    if (query.length < 3) {
      setSaranLokasi([])
      setShowSaran(false)
      return
    }

    setIsLoadingSaran(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
      )
      const data = await res.json()
      if (data && data.length > 0) {
        setSaranLokasi(data)
        setShowSaran(true)
      } else {
        setSaranLokasi([])
        setShowSaran(false)
      }
    } catch (e) {
      setSaranLokasi([])
      setShowSaran(false)
    }
    setIsLoadingSaran(false)
  }

  // ============== AUTOCOMPLETE EDIT FUNCTION ==============
  const cariSaranLokasiEdit = async (query: string) => {
    if (query.length < 3) {
      setSaranLokasiEdit([])
      setShowSaranEdit(false)
      return
    }

    setIsLoadingSaranEdit(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
      )
      const data = await res.json()
      if (data && data.length > 0) {
        setSaranLokasiEdit(data)
        setShowSaranEdit(true)
      } else {
        setSaranLokasiEdit([])
        setShowSaranEdit(false)
      }
    } catch (e) {
      setSaranLokasiEdit([])
      setShowSaranEdit(false)
    }
    setIsLoadingSaranEdit(false)
  }

  // ============== DEBOUNCE ==============
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputLokasi.trim().length >= 3) {
        cariSaranLokasi(inputLokasi)
      } else {
        setSaranLokasi([])
        setShowSaran(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputLokasi])

  // ============== DEBOUNCE EDIT ==============
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editLokasi.trim().length >= 3) {
        cariSaranLokasiEdit(editLokasi)
      } else {
        setSaranLokasiEdit([])
        setShowSaranEdit(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [editLokasi])

  // ============== PILIH SARAN ==============
  const pilihSaran = (item: any) => {
    const displayName = item.display_name || item.name || ''
    setInputLokasi(displayName)
    setSaranLokasi([])
    setShowSaran(false)
  }

  // ============== PILIH SARAN EDIT ==============
  const pilihSaranEdit = (item: any) => {
    const displayName = item.display_name || item.name || ''
    setEditLokasi(displayName)
    setSaranLokasiEdit([])
    setShowSaranEdit(false)
  }

  useEffect(() => {
    const saved = localStorage.getItem('gerakDuluData')
    if (saved) setData(JSON.parse(saved))
    setLoading(false)

    const success = async (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords
      setPosisi(prev => ({ ...prev, lat: latitude, lng: longitude }))
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=16&addressdetails=1`
        )
        const data = await res.json()
        if (data.address) {
          const a = data.address
          const nama = a.road || a.suburb || a.village || a.town || a.city || a.county || 'Lokasi'
          setPosisi(prev => ({ ...prev, nama }))
        } else {
          setPosisi(prev => ({ ...prev, nama: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }))
        }
      } catch (e) {
        setPosisi(prev => ({ ...prev, nama: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }))
      }
    }

    const error = () => {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data.latitude && data.longitude) {
            setPosisi({
              lat: data.latitude,
              lng: data.longitude,
              nama: data.city || data.region || 'IP Location'
            })
          } else {
            setPosisi({ lat: null, lng: null, nama: 'Aktifkan GPS' })
          }
        })
        .catch(() => {
          setPosisi({ lat: null, lng: null, nama: 'Aktifkan GPS' })
        })
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      })
    } else {
      error()
    }

    const intervalGPS = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        })
      }
    }, 60000)

    return () => clearInterval(intervalGPS)
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

  const getKoordinatDanDaerah = async (alamat: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(alamat)}&format=json&limit=1`
      )
      const data = await res.json()
      if (data && data.length > 0) {
        const result = data[0]
        const address = result.address || {}
        const daerah = address.suburb || address.village || address.town || address.city || address.county || 'Tidak Diketahui'
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          daerah: daerah
        }
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

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const getRekomendasi = async () => {
    if (data.length === 0) return []
    if (!posisi.lat || !posisi.lng) return []

    setLoadingJarak(true)

    const now = new Date()
    const jamSekarang = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const getSelisihMenit = (jamSpot: string) => {
      const [h1, m1] = jamSekarang.split(':').map(Number)
      const [h2, m2] = jamSpot.split(':').map(Number)
      return (h2 * 60 + m2) - (h1 * 60 + m1)
    }

    let filtered = data
    if (hariFilter !== 'all') {
      filtered = data.filter((d: Spot) => d.hari === parseInt(hariFilter))
    }
    filtered = filtered.filter((d: Spot) => d.jam >= jamSekarang && d.jam <= '23:59')

    const cariDenganBatas = (batasMenit: number) => {
      return filtered.filter((d: Spot) => {
        const selisih = getSelisihMenit(d.jam)
        return selisih >= 0 && selisih <= batasMenit
      })
    }

    let hasilProgresif: Spot[] = []
    const batasWaktu = [60, 120, 180, 240, 360, 720]
    for (const batas of batasWaktu) {
      const hasil = cariDenganBatas(batas)
      if (hasil.length > 0) {
        hasilProgresif = hasil
        break
      }
    }
    if (hasilProgresif.length === 0) {
      hasilProgresif = filtered
    }

    const posisiLat = posisi.lat
    const posisiLng = posisi.lng

    const semuaDenganJarak = filtered.map((item) => {
      let jarakHaversine = Infinity
      if (item.lat !== null && item.lat !== undefined && item.lng !== null && item.lng !== undefined) {
        jarakHaversine = haversine(posisiLat!, posisiLng!, item.lat, item.lng)
      }
      return { ...item, jarakHaversine }
    })

    semuaDenganJarak.sort((a, b) => a.jarakHaversine - b.jarakHaversine)

    const limaKandidat = semuaDenganJarak.slice(0, 5)

    const results: any[] = []
    for (const item of limaKandidat) {
      const { bintang, count } = getBintang(item.jam, item.lokasi)
      
      let jarakReal: number | null = null
      if (item.lat !== null && item.lat !== undefined && item.lng !== null && item.lng !== undefined) {
        jarakReal = await hitungJarakOSRM(posisiLat!, posisiLng!, item.lat, item.lng)
      }

      const selisihMenit = getSelisihMenit(item.jam)
      const selisihJam = Math.floor(selisihMenit / 60)
      const selisihSisaMenit = selisihMenit % 60
      const selisihText = selisihJam > 0 ? `${selisihJam}j ${selisihSisaMenit}m` : `${selisihSisaMenit}m`

      results.push({
        ...item,
        bintang,
        count,
        jarak: jarakReal,
        selisihMenit,
        selisihText
      })
    }

    results.sort((a, b) => {
      if (a.jarak !== null && b.jarak !== null && a.jarak !== b.jarak) {
        return a.jarak - b.jarak
      }
      if (a.bintang.length !== b.bintang.length) {
        return b.bintang.length - a.bintang.length
      }
      return a.ongkir - b.ongkir
    })

    const rekom = results.length > 0 ? [results[0]] : []

    const spotLain = results.slice(1)
    spotLain.sort((a, b) => a.selisihMenit - b.selisihMenit)

    setLoadingJarak(false)
    return [...rekom, ...spotLain]
  }

  const hariNama = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

  const simpanSpot = async () => {
    if (!inputLokasi || !inputJam || !inputOngkir || parseInt(inputOngkir) <= 0) {
      alert('Isi semua data dengan benar!')
      return
    }
    const jam = bulatkanJam(inputJam)
    const hari = inputHari !== '' ? parseInt(inputHari) : new Date().getDay()
    
    const result = await getKoordinatDanDaerah(inputLokasi)
    
    const dataNow = getData()
    dataNow.push({
      id: getNextId(dataNow),
      lokasi: inputLokasi,
      jam: jam,
      ongkir: parseInt(inputOngkir),
      hari: hari,
      tanggal: new Date().toISOString(),
      lat: result?.lat || null,
      lng: result?.lng || null,
      daerah: result?.daerah || null
    })
    setDataStorage(dataNow)
    setInputLokasi('')
    setInputJam('')
    setInputOngkir('')
    setInputHari('')
    setHalaman('home')
    getRekomendasi().then(setRekomendasi)
  }

  const hapusSpot = (id: number) => {
    if (!confirm('Hapus spot ini?')) return
    const dataNow = getData()
    setDataStorage(dataNow.filter((d: Spot) => d.id !== id))
    getRekomendasi().then(setRekomendasi)
  }

  // ============== FUNGSI KELOLA ==============
  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const toggleSelectAll = () => {
    const filteredData = data.filter((d: Spot) => 
      d.lokasi.toLowerCase().includes(cariKeyword.toLowerCase())
    )
    const currentData = filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )
    if (selectAll) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(currentData.map(item => item.id)))
    }
    setSelectAll(!selectAll)
  }

  const hapusDipilih = () => {
    if (selectedIds.size === 0) {
      alert('Pilih spot dulu!')
      return
    }
    if (!confirm(`Hapus ${selectedIds.size} spot yang dipilih?`)) return
    const dataNow = getData()
    setDataStorage(dataNow.filter((d: Spot) => !selectedIds.has(d.id)))
    setSelectedIds(new Set())
    setSelectAll(false)
    getRekomendasi().then(setRekomendasi)
  }

  const hapusSemua = () => {
    if (data.length === 0) {
      alert('Belum ada data!')
      return
    }
    if (!confirm('⚠️ Hapus SEMUA data? Ini permanen!')) return
    setDataStorage([])
    setSelectedIds(new Set())
    setSelectAll(false)
    getRekomendasi().then(setRekomendasi)
  }

  const openEditModal = (item: Spot) => {
    setEditData(item)
    setEditLokasi(item.lokasi)
    setEditJam(item.jam)
    setEditOngkir(item.ongkir.toString())
    setEditHari(item.hari.toString())
    setShowEditModal(true)
  }

  const saveEdit = async () => {
    if (!editData) return
    if (!editLokasi || !editJam || !editOngkir || parseInt(editOngkir) <= 0) {
      alert('Isi semua data dengan benar!')
      return
    }

    const result = await getKoordinatDanDaerah(editLokasi)

    const dataNow = getData()
    const index = dataNow.findIndex((d: Spot) => d.id === editData.id)
    if (index !== -1) {
      dataNow[index] = {
        ...dataNow[index],
        lokasi: editLokasi,
        jam: bulatkanJam(editJam),
        ongkir: parseInt(editOngkir),
        hari: parseInt(editHari),
        lat: result?.lat || null,
        lng: result?.lng || null,
        daerah: result?.daerah || null
      }
      setDataStorage(dataNow)
      getRekomendasi().then(setRekomendasi)
    }
    setShowEditModal(false)
    setEditData(null)
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
              tanggal: item.tanggal || new Date().toISOString(),
              lat: item.lat || null,
              lng: item.lng || null,
              daerah: item.daerah || null
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
    if (!loading) {
      getRekomendasi().then(setRekomendasi)
    }
  }

  useEffect(() => {
    loadRekomendasi()
    const interval = setInterval(loadRekomendasi, 60000)
    return () => clearInterval(interval)
  }, [data, loading, hariFilter, posisi.lat, posisi.lng])

  // ============== STATISTIK ==============
  const getStatistik = () => {
    let filtered = data
    if (statHariFilter !== 'all') {
      filtered = data.filter((d: Spot) => d.hari === parseInt(statHariFilter))
    }

    filtered = filtered.filter((d: Spot) => d.daerah && d.daerah !== 'Tidak Diketahui')

    const jamMap: { [key: string]: { [key: string]: number } } = {}
    filtered.forEach((item) => {
      const jam = item.jam.slice(0, 2)
      const daerah = item.daerah || 'Tidak Diketahui'
      if (!jamMap[jam]) jamMap[jam] = {}
      if (!jamMap[jam][daerah]) jamMap[jam][daerah] = 0
      jamMap[jam][daerah]++
    })

    const jamStats = Object.keys(jamMap).sort().map((jam) => {
      const daerahs = jamMap[jam]
      let maxDaerah = ''
      let maxCount = 0
      Object.keys(daerahs).forEach((d) => {
        if (daerahs[d] > maxCount) {
          maxCount = daerahs[d]
          maxDaerah = d
        }
      })
      return { jam, daerah: maxDaerah, count: maxCount }
    })

    const daerahTotal: { [key: string]: number } = {}
    filtered.forEach((item) => {
      const daerah = item.daerah || 'Tidak Diketahui'
      if (!daerahTotal[daerah]) daerahTotal[daerah] = 0
      daerahTotal[daerah]++
    })
    const topDaerah = Object.keys(daerahTotal)
      .map((d) => ({ daerah: d, total: daerahTotal[d] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)

    const jamTotal: { [key: string]: number } = {}
    filtered.forEach((item) => {
      const jam = item.jam.slice(0, 2)
      if (!jamTotal[jam]) jamTotal[jam] = 0
      jamTotal[jam]++
    })
    const topJam = Object.keys(jamTotal)
      .map((j) => ({ jam: j, total: jamTotal[j] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)

    return { jamStats, topDaerah, topJam }
  }

  // ============== RENDER STATISTIK ==============
  const renderStatistik = () => {
    const { jamStats, topDaerah, topJam } = getStatistik()

    const getWeatherIcon = (jam: string) => {
      const h = parseInt(jam)
      if (h >= 5 && h < 7) return '🌅'
      if (h >= 7 && h < 11) return '☀️'
      if (h >= 11 && h < 14) return '🌤️'
      if (h >= 14 && h < 17) return '⛅'
      if (h >= 17 && h < 19) return '🌥️'
      if (h >= 19 && h < 21) return '🌙'
      return '🌙'
    }

    return (
      <div className="halaman">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
          <h2 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700 }}>📊 STATISTIK</h2>
          <button className="btn-close" onClick={() => {
            setHalaman('home')
            window.history.pushState(null, '', window.location.href)
          }}>✕</button>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center',
          marginBottom: 'clamp(12px, 3vw, 16px)',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '14px', color: '#8888aa' }}>📅</span>
          <button 
            onClick={() => setStatHariFilter('all')}
            style={{ 
              background: statHariFilter === 'all' ? '#ff6b00' : '#1a1a2e',
              color: statHariFilter === 'all' ? '#fff' : '#8888aa',
              border: '1px solid #2a2a3e',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: statHariFilter === 'all' ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            Semua
          </button>
          <button 
            onClick={() => {
              const today = new Date().getDay()
              setStatHariFilter(String(today))
            }}
            style={{ 
              background: statHariFilter !== 'all' && statHariFilter === String(new Date().getDay()) ? '#ff6b00' : '#1a1a2e',
              color: statHariFilter !== 'all' && statHariFilter === String(new Date().getDay()) ? '#fff' : '#8888aa',
              border: '1px solid #2a2a3e',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: statHariFilter !== 'all' && statHariFilter === String(new Date().getDay()) ? 'bold' : 'normal',
              cursor: 'pointer'
            }}
          >
            Hari Ini
          </button>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ 
                background: '#1a1a2e',
                color: '#fff',
                border: '1px solid #2a2a3e',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {statHariFilter !== 'all' && statHariFilter !== String(new Date().getDay()) 
                ? hariNama[parseInt(statHariFilter)] 
                : '▼'}
            </button>
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '8px',
                padding: '6px 0',
                marginTop: '4px',
                zIndex: 10,
                minWidth: '120px'
              }}>
                {[0, 1, 2, 3, 4, 5, 6].map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setStatHariFilter(String(h))
                      setShowDropdown(false)
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      textAlign: 'left',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a3e'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {hariNama[h]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          background: '#12121f', 
          borderRadius: '16px', 
          padding: 'clamp(12px, 3vw, 16px)',
          border: '1px solid #2a2a3e',
          marginBottom: '12px'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '6px 16px'
          }}>
            {jamStats.map((item) => {
              const maxCount = jamStats.length > 0 ? Math.max(...jamStats.map(j => j.count)) : 1
              const barWidth = Math.round((item.count / maxCount) * 100)
              const isPeak = item.count === maxCount && maxCount > 0
              
              return (
                <div 
                  key={item.jam} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: isPeak ? 'rgba(255,107,0,0.15)' : 'transparent',
                    border: isPeak ? '1px solid rgba(255,107,0,0.3)' : 'none'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                    <span>{getWeatherIcon(item.jam)}</span>
                    <span style={{ color: '#8888aa', fontWeight: 'bold' }}>{item.jam}:00</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                    <span style={{ 
                      display: 'inline-block',
                      height: '6px',
                      borderRadius: '3px',
                      background: isPeak ? '#ff6b00' : '#ff6b0044',
                      width: `${Math.max(barWidth, 10)}%`,
                      maxWidth: '80px',
                      transition: 'width 0.3s'
                    }} />
                    <span style={{ 
                      color: isPeak ? '#ff6b00' : '#aaa', 
                      fontWeight: isPeak ? 'bold' : 'normal',
                      fontSize: 'clamp(11px, 2vw, 13px)',
                      minWidth: '32px',
                      textAlign: 'right'
                    }}>
                      {item.count}x
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #12121f 100%)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #2a2a3e'
          }}>
            <div style={{ fontSize: '13px', color: '#8888aa', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🏆</span> TOP DAERAH
            </div>
            {topDaerah.map((item, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '6px 0',
                borderBottom: idx < topDaerah.length - 1 ? '1px solid #2a2a3e' : 'none'
              }}>
                <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ 
                    background: idx === 0 ? '#ff6b00' : '#2a2a3e',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>{idx + 1}</span>
                  {item.daerah}
                </span>
                <span style={{ color: '#ff6b00', fontWeight: 'bold' }}>{item.total}x</span>
              </div>
            ))}
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #12121f 100%)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #2a2a3e'
          }}>
            <div style={{ fontSize: '13px', color: '#8888aa', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⏰</span> JAM SIBUK
            </div>
            {topJam.map((item, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '6px 0',
                borderBottom: idx < topJam.length - 1 ? '1px solid #2a2a3e' : 'none'
              }}>
                <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ 
                    background: idx === 0 ? '#ff6b00' : '#2a2a3e',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>{idx + 1}</span>
                  {item.jam}:00
                </span>
                <span style={{ color: '#ff6b00', fontWeight: 'bold' }}>{item.total}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ============== RENDER HOME ==============
  const renderHome = () => {
    const utama = rekomendasi.length > 0 ? rekomendasi[0] : null
    const lain = rekomendasi.slice(1)

    const gpsAktif = posisi.lat !== null && posisi.lng !== null
    const totalSpot = data.length

    const bottomButtonStyle = {
      flex: 1,
      minWidth: '60px',
      background: '#1a1a2e',
      color: '#fff',
      border: '1px solid #2a2a3e',
      borderRadius: '10px',
      padding: 'clamp(8px, 2vw, 12px)',
      fontSize: 'clamp(12px, 2.5vw, 14px)',
      fontWeight: 'bold',
      cursor: 'pointer',
      textAlign: 'center' as const
    }

    return (
      <div className="halaman">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(8px, 2vw, 12px)' }}>
          <h1 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1.5vw, 8px)' }}>
            <img src="/favicon.ico" alt="logo" style={{ width: 'clamp(24px, 6vw, 32px)', height: 'clamp(24px, 6vw, 32px)' }} />
            <span>GERAK <span style={{ color: '#ff6b00' }}>DULU</span></span>
          </h1>
          <span style={{ color: '#ff6b00', fontWeight: 700, fontSize: 'clamp(16px, 4vw, 22px)' }}>⏰ {jam}</span>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: 'clamp(8px, 2vw, 12px)', 
          marginBottom: 'clamp(10px, 2.5vw, 14px)',
          width: '100%'
        }}>
          <button 
            onClick={() => {
              setHalaman('tambah')
              window.history.pushState(null, '', window.location.href)
            }} 
            style={{ 
              flex: 1,
              background: '#ff6b00', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '10px', 
              padding: 'clamp(8px, 2vw, 12px)',
              fontWeight: 'bold',
              fontSize: 'clamp(13px, 3vw, 16px)',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255,107,0,0.2)'
            }}
          >
            ➕ Tambah
          </button>
          <button 
            onClick={handleInstall}
            style={{ 
              flex: 1,
              background: isInstalled ? '#2a2a3e' : '#ff6b00',
              color: isInstalled ? '#888' : '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: 'clamp(8px, 2vw, 12px)',
              fontWeight: 'bold',
              fontSize: 'clamp(13px, 3vw, 16px)',
              cursor: isInstalled ? 'default' : 'pointer',
              opacity: isInstalled ? 0.5 : 1
            }}
            disabled={isInstalled}
          >
            {isInstalled ? '✅ Terinstall' : '📲 Install'}
          </button>
        </div>

        <div className="posisi-bar" style={{ 
          background: gpsAktif ? '#1a1a2e' : '#2a1a1a',
          border: gpsAktif ? '1px solid #2a2a4e' : '1px solid #ff4444'
        }}>
          <span className="label">📍 LOKASI</span>
          <span className="value" style={{ color: gpsAktif ? '#fff' : '#ff6666' }}>
            {posisi.nama}
            {!gpsAktif && ' ⚠️'}
          </span>
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

        {!gpsAktif && (
          <div style={{ 
            background: '#2a1a1a', 
            border: '1px solid #ff4444',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ color: '#ff6666', fontSize: '18px', fontWeight: 'bold' }}>
              ⚠️ GPS BELUM AKTIF
            </div>
            <div style={{ color: '#ff8888', fontSize: '14px', marginTop: '8px' }}>
              Nyalakan GPS dan izinkan akses lokasi di browser
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '12px',
                background: '#ff6b00',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh GPS
            </button>
          </div>
        )}

        {gpsAktif && (
          <div className="rekom-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge-orange" style={{ fontSize: '14px', padding: '4px 12px' }}>🎯 REKOMENDASI</span>
              <span className="bintang" style={{ fontSize: '20px' }}>{utama ? utama.bintang : '⭐'}</span>
            </div>
            {!utama ? (
              <div style={{ color: '#8888aa', textAlign: 'center', padding: '16px' }}>
                Tidak ada rekomendasi
              </div>
            ) : (
              <>
                <div className="lokasi" style={{ fontSize: 'clamp(18px, 4.5vw, 22px)', fontWeight: 600, marginBottom: '8px' }}>
                  {utama.lokasi}
                </div>
                <div className="detail" style={{ fontSize: '14px', gap: '12px' }}>
                  <span>⏰ {utama.jam}</span>
                  <span>⏳ {utama.selisihText} lagi</span>
                  <span>🛵 {utama.count}x dapet</span>
                  <span>📏 {utama.jarak !== null ? `${utama.jarak} km` : '?'}</span>
                  <span>💰 Rp {utama.ongkir.toLocaleString()}</span>
                </div>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    const searchQuery = encodeURIComponent(utama.lokasi)
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${searchQuery}&travelmode=driving`, '_blank')
                  }}
                  style={{ 
                    marginTop: '12px', 
                    padding: '8px 16px', 
                    fontSize: '14px',
                    width: '100%'
                  }}
                >
                  🚀 NAVIGASI
                </button>
              </>
            )}
          </div>
        )}

        {gpsAktif && (
          <div className="card">
            <div className="card-header">
              <span style={{ fontWeight: 600 }}>📋 SPOT LAIN</span>
              <span className="text-muted">{lain.length} spot</span>
            </div>
            {lain.length === 0 ? (
              <div style={{ color: '#8888aa', textAlign: 'center', padding: 'clamp(16px, 4vw, 24px)' }}>Tidak ada spot lain.</div>
            ) : (
              lain.map((item) => (
                <div key={item.id} className="spot-item" style={{ padding: '10px 0' }}>
                  <div className="kiri">
                    <div className="nama" style={{ fontSize: '15px' }}>{item.bintang} {item.lokasi}</div>
                    <div className="jam" style={{ fontSize: '13px' }}>
                      ⏰ {item.jam} 
                      ⏳ {item.selisihText} lagi
                      💰 Rp {item.ongkir.toLocaleString()} ({item.count}x) 
                      📏 {item.jarak !== null ? `${item.jarak} km` : '?'}
                    </div>
                  </div>
                  <div className="kanan" style={{ fontSize: '13px' }}>{item.count}x</div>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 'clamp(12px, 2.5vw, 16px)'
        }}>
          <button onClick={() => {
            setHalaman('statistik')
            window.history.pushState(null, '', window.location.href)
          }} style={bottomButtonStyle}>📊 Statistik</button>
          <button onClick={() => {
            setHalaman('kelola')
            window.history.pushState(null, '', window.location.href)
          }} style={bottomButtonStyle}>📋 Kelola</button>
          <button onClick={() => {
            setHalaman('backup')
            window.history.pushState(null, '', window.location.href)
          }} style={bottomButtonStyle}>💾 Backup</button>
        </div>
      </div>
    )
  }

  // ============== RENDER TAMBAH ==============
  const renderTambah = () => (
    <div className="halaman">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
        <h2 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700 }}>📝 Tambah Spot</h2>
        <button className="btn-close" onClick={() => {
          setHalaman('home')
          window.history.pushState(null, '', window.location.href)
        }}>✕</button>
      </div>
      <div className="input-group" style={{ position: 'relative' }}>
        <label>Lokasi (isi alamat jelas + kota)</label>
        <input 
          value={inputLokasi} 
          onChange={(e) => setInputLokasi(e.target.value)} 
          placeholder="Jl. Mesjid, Cimahi" 
          autoComplete="off"
        />
        <div style={{ fontSize: '11px', color: '#8888aa', marginTop: '4px' }}>
          {isLoadingSaran ? '⏳ Mencari...' : 'Mulai ketik untuk saran lokasi'}
        </div>
        
        {showSaran && saranLokasi.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#1a1a2e',
            border: '1px solid #2a2a3e',
            borderRadius: '10px',
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
          }}>
            {saranLokasi.map((item, idx) => (
              <div
                key={idx}
                onClick={() => pilihSaran(item)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: idx < saranLokasi.length - 1 ? '1px solid #2a2a3e' : 'none',
                  fontSize: '14px',
                  color: '#fff',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a3e'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 500 }}>{item.display_name || item.name}</div>
                <div style={{ fontSize: '11px', color: '#8888aa' }}>
                  {item.address?.city || item.address?.town || item.address?.county || ''}
                </div>
              </div>
            ))}
          </div>
        )}
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

  // ============== RENDER KELOLA ==============
  const renderKelola = () => {
    const filteredData = data.filter((d: Spot) => 
      d.lokasi.toLowerCase().includes(cariKeyword.toLowerCase())
    )

    const totalItems = filteredData.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage)

    const goToPage = (page: number) => {
      if (page < 1 || page > totalPages) return
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
      <div className="halaman">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
          <h2 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700 }}>📋 Semua Spot</h2>
          <button className="btn-close" onClick={() => {
            setHalaman('home')
            window.history.pushState(null, '', window.location.href)
          }}>✕</button>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '12px'
        }}>
          <button
            onClick={hapusDipilih}
            style={{
              background: '#ff4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              flex: 1,
              minWidth: '80px'
            }}
          >
            🗑️ Hapus Dipilih ({selectedIds.size})
          </button>
          <button
            onClick={hapusSemua}
            style={{
              background: '#ff4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              flex: 1,
              minWidth: '80px'
            }}
          >
            🗑️ Hapus Semua
          </button>
          <button
            onClick={toggleSelectAll}
            style={{
              background: '#2a6bff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              flex: 1,
              minWidth: '80px'
            }}
          >
            {selectAll ? '☐ Batal' : '☑️ Centang Semua'}
          </button>
        </div>

        <div className="input-group">
          <label>🔍 Cari lokasi</label>
          <input 
            value={cariKeyword} 
            onChange={(e) => setCariKeyword(e.target.value)} 
            placeholder="Cari lokasi..." 
          />
        </div>

        {currentData.length === 0 ? (
          <div style={{ color: '#8888aa', textAlign: 'center', padding: 'clamp(20px, 5vw, 32px)' }}>
            {filteredData.length === 0 ? 'Tidak ada data.' : 'Tidak ada data di halaman ini.'}
          </div>
        ) : (
          currentData.map((item) => {
            const { bintang, count } = getBintang(item.jam, item.lokasi)
            const isChecked = selectedIds.has(item.id)
            return (
              <div key={item.id} className="spot-item" style={{ padding: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSelect(item.id)}
                  style={{
                    width: '20px',
                    height: '20px',
                    accentColor: '#ff6b00',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                />
                <div className="kiri" style={{ flex: 1 }}>
                  <div className="nama" style={{ fontSize: '15px' }}>{bintang} ({count}x) {item.lokasi}</div>
                  <div className="jam" style={{ fontSize: '13px' }}>⏰ {item.jam} 💰 Rp {item.ongkir.toLocaleString()} 📅 {new Date(item.tanggal).toLocaleDateString('id-ID')}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button 
                    className="btn-edit" 
                    onClick={() => openEditModal(item)}
                    style={{
                      background: '#2a6bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => hapusSpot(item.id)} 
                    style={{
                      background: '#ff4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })
        )}

        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: 'clamp(16px, 3vw, 24px)',
            padding: '12px 0'
          }}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                background: currentPage === 1 ? '#2a2a3e' : '#ff6b00',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '13px',
                cursor: currentPage === 1 ? 'default' : 'pointer',
                opacity: currentPage === 1 ? 0.4 : 1
              }}
            >
              ◀
            </button>

            <span style={{ color: '#8888aa', fontSize: '13px' }}>
              Halaman {currentPage} dari {totalPages}
            </span>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                background: currentPage === totalPages ? '#2a2a3e' : '#ff6b00',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '13px',
                cursor: currentPage === totalPages ? 'default' : 'pointer',
                opacity: currentPage === totalPages ? 0.4 : 1
              }}
            >
              ▶
            </button>

            <span style={{ color: '#555', fontSize: '12px', marginLeft: '8px' }}>
              Total {totalItems} spot
            </span>
          </div>
        )}

        {/* MODAL EDIT - FIXED DI TENGAH DENGAN AUTOCOMPLETE */}
        {showEditModal && editData && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px',
            backdropFilter: 'blur(4px)',
            transform: 'none',
            willChange: 'transform'
          }}>
            <div style={{
              background: '#1a1a2e',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              border: '1px solid #ff6b0044',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              maxHeight: '85vh',
              overflowY: 'auto',
              position: 'relative',
              transform: 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>✏️ Edit Spot</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#8888aa',
                    fontSize: '24px',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="input-group" style={{ position: 'relative' }}>
                <label>Lokasi (alamat + kota)</label>
                <input 
                  value={editLokasi} 
                  onChange={(e) => setEditLokasi(e.target.value)} 
                  placeholder="Jl. Mesjid, Cimahi" 
                  autoComplete="off"
                />
                <div style={{ fontSize: '11px', color: '#8888aa', marginTop: '4px' }}>
                  {isLoadingSaranEdit ? '⏳ Mencari...' : 'Mulai ketik untuk saran lokasi'}
                </div>
                
                {showSaranEdit && saranLokasiEdit.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#1a1a2e',
                    border: '1px solid #2a2a3e',
                    borderRadius: '10px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 100,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}>
                    {saranLokasiEdit.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => pilihSaranEdit(item)}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          borderBottom: idx < saranLokasiEdit.length - 1 ? '1px solid #2a2a3e' : 'none',
                          fontSize: '14px',
                          color: '#fff',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a3e'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ fontWeight: 500 }}>{item.display_name || item.name}</div>
                        <div style={{ fontSize: '11px', color: '#8888aa' }}>
                          {item.address?.city || item.address?.town || item.address?.county || ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>Jam</label>
                <input 
                  value={editJam} 
                  onChange={(e) => setEditJam(formatJamOtomatis(e.target.value))} 
                  placeholder="1030" 
                />
              </div>

              <div className="input-group">
                <label>Ongkir (Rp)</label>
                <input 
                  value={editOngkir} 
                  onChange={(e) => setEditOngkir(e.target.value)} 
                  placeholder="15000" 
                  type="number" 
                />
              </div>

              <div className="input-group">
                <label>Hari</label>
                <select value={editHari} onChange={(e) => setEditHari(e.target.value)}>
                  <option value="0">Minggu</option>
                  <option value="1">Senin</option>
                  <option value="2">Selasa</option>
                  <option value="3">Rabu</option>
                  <option value="4">Kamis</option>
                  <option value="5">Jumat</option>
                  <option value="6">Sabtu</option>
                </select>
              </div>

              <button 
                className="btn-primary" 
                onClick={saveEdit}
                style={{ width: '100%', marginTop: '8px' }}
              >
                💾 Simpan Perubahan
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ============== RENDER BACKUP ==============
  const renderBackup = () => (
    <div className="halaman">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
        <h2 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: 700 }}>💾 Backup</h2>
        <button className="btn-close" onClick={() => {
          setHalaman('home')
          window.history.pushState(null, '', window.location.href)
        }}>✕</button>
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
    <main style={{ 
      background: '#0a0a0f', 
      minHeight: '100vh', 
      padding: 'clamp(10px, 3vw, 16px)', 
      paddingBottom: 'clamp(20px, 4vw, 40px)',
      color: '#fff' 
    }}>
      <div className="container">
        {halaman === 'home' && renderHome()}
        {halaman === 'tambah' && renderTambah()}
        {halaman === 'kelola' && renderKelola()}
        {halaman === 'backup' && renderBackup()}
        {halaman === 'statistik' && renderStatistik()}
      </div>

      {/* ============== FOOTER KEREN ============== */}
      <div style={{
        marginTop: 'clamp(12px, 2vw, 16px)',
        borderTop: '2px solid #ff6b00',
        paddingTop: 'clamp(8px, 1.5vw, 12px)',
        paddingBottom: 'clamp(8px, 1.5vw, 12px)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '4px',
          marginBottom: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontWeight: 800,
              fontSize: 'clamp(14px, 3vw, 16px)',
              color: '#ff6b00',
              letterSpacing: '0.5px'
            }}>
              🚀 GERAK DULU
            </span>
            <span style={{
              fontSize: 'clamp(10px, 1.8vw, 11px)',
              color: '#666',
              background: '#1a1a2e',
              padding: '1px 8px',
              borderRadius: '20px',
              border: '1px solid #2a2a3e'
            }}>
              v2.0
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 2vw, 12px)',
            flexWrap: 'wrap'
          }}>
            <span style={{
              fontSize: 'clamp(11px, 2vw, 12px)',
              color: '#aaa',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              📊 {data.length} spot
            </span>
            <span style={{
              fontSize: 'clamp(11px, 2vw, 12px)',
              color: posisi.lat ? '#4ade80' : '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {posisi.lat ? '🟢 GPS Aktif' : '🔴 GPS Mati'}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2px',
          borderTop: '1px solid #2a2a3e',
          paddingTop: '4px'
        }}>
          <span style={{
            fontSize: 'clamp(10px, 1.8vw, 11px)',
            color: '#666'
          }}>
            dibuat oleh <span style={{ color: '#ff6b00', fontWeight: 600 }}>mpermana99</span>
          </span>
          <span style={{
            fontSize: 'clamp(10px, 1.8vw, 11px)',
            color: '#555'
          }}>
            © {new Date().getFullYear()} Gerak Dulu
          </span>
        </div>
      </div>
    </main>
  )
}