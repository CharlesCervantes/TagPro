/* eslint-disable @typescript-eslint/no-unused-vars */
import '@/globalStyle.css';
import '@mantine/core/styles.css';
import styles from '@/App.module.scss';
import { useEffect, useState } from 'react';
import { useFetch} from '@/hooks';
import { useParams } from 'react-router-dom';
import { useAppState } from '@/store/app.store';
import { getUser, updateUser } from '@/services';
import { TopBar } from '@/components/Topbar/Topbar';
import { ImageTag } from '@/components/Canva/imageTag';
import { ClassCard } from '@/components/Classes/classes';
import { ImageList } from '@/components/ImageList/imageList';

import { User } from '@/interfaces';
import toast from 'react-hot-toast';
import svg_denied_access from '@/assets/denied_access.svg';

export function Home() {
  const { imageIndex, imageRectangles } = useAppState();
  const { callEndpoint } = useFetch<User>();
  const { id } = useParams();
  const [lock, setLock] = useState<boolean>(false);

  useEffect(() => {
  }, [imageRectangles, imageIndex]);

  useEffect(() => {
    const getUserData = async () => {
      if (id !== undefined) {
        try {
          const response = await callEndpoint(getUser(id));
          const data = response.data;
          if (data.activeUrl === false) {
            setLock(true);
          }
          const user = {
            ...data,
            activeUrl: false
          }
          await callEndpoint(updateUser(id, user))
        } catch (e) {
          toast.error("Error fetching user data:", e);
        }
      }
    };

    getUserData();
  }, [id]);

  if (lock) {
    return (
      <div className={styles.lockedMessage}>
        <img src={svg_denied_access} alt="Access Denied" />
        <p>Está bloqueado</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContent}>
      <div className={styles.topBar}>
        <TopBar />
      </div>
      <div className={styles.content}>
        <div className={styles.imageTag}>
          <ImageTag />
        </div>
        <div className={styles.labels}>
          <div className={styles.div1}>
            <ImageList />
          </div>
          <div className={styles.div2}>
            <ClassCard />
          </div>
        </div>
      </div>
    </div>
  );
}
