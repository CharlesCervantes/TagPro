import { currentEndpoint } from '@/constants'
import { loadAbort } from '@/tools'
import axios from 'axios'
import { User } from '@/interfaces'

export const getUser = (id: string) => {
    const controller = loadAbort()
    return {
        call: axios.get<User>(`${currentEndpoint}user/${id}`, {
            signal: controller.signal,
        })
    }
}

export const updateUser = (id: string, updateUser: User) => {
    const controller = loadAbort()
    return {
        call: axios.put(`${currentEndpoint}user/${id}`, updateUser,{
            signal: controller.signal,
        }),
        controller
    }
}